use crate::{
    ast::{BlockKind, BlockNode, InlineKind, InlineNode, ListItemNode, NodeId},
    selection::TextRange,
};

#[derive(Debug, Clone, Copy)]
struct Line<'a> {
    start: usize,
    end: usize,
    end_with_newline: usize,
    text: &'a str,
}

#[derive(Debug, Default)]
struct NodeIdGenerator {
    next: NodeId,
}

impl NodeIdGenerator {
    fn next(&mut self) -> NodeId {
        self.next += 1;
        self.next
    }
}

pub fn normalize_code_language(input: &str) -> Option<String> {
    let trimmed = input.trim().to_ascii_lowercase();
    if trimmed.is_empty() {
        return None;
    }

    let canonical = match trimmed.as_str() {
        "py" => "python",
        "js" => "javascript",
        "ts" => "typescript",
        "c++" => "cpp",
        "sh" | "shell" => "bash",
        other => other,
    };

    Some(canonical.to_string())
}

pub fn parse_document(markdown: &str) -> Vec<BlockNode> {
    let lines = scan_lines(markdown);
    let mut index = 0;
    let mut id_gen = NodeIdGenerator::default();
    let mut blocks = Vec::new();

    while index < lines.len() {
        let line = lines[index];

        if line.text.trim().is_empty() {
            blocks.push(BlockNode {
                node_id: id_gen.next(),
                range: TextRange::new(line.start as u32, line.start as u32),
                kind: BlockKind::Paragraph { inlines: Vec::new() },
            });
            index += 1;
            continue;
        }

        if let Some((language, fence_len)) = parse_fence_open(line.text) {
            let mut closing_index = index + 1;
            while closing_index < lines.len()
                && !is_closing_fence(lines[closing_index].text, fence_len)
            {
                closing_index += 1;
            }

            let content_start = line.end_with_newline.min(markdown.len());
            let content_end = if closing_index < lines.len() {
                lines[closing_index].start
            } else {
                markdown.len()
            };
            let code = markdown[content_start..content_end].to_string();
            let range_end = if closing_index < lines.len() {
                lines[closing_index].end_with_newline
            } else {
                line.end_with_newline.max(content_end)
            };

            blocks.push(BlockNode {
                node_id: id_gen.next(),
                range: TextRange::new(line.start as u32, range_end as u32),
                kind: BlockKind::FencedCode {
                    language,
                    text_range: TextRange::new(content_start as u32, content_end as u32),
                    code,
                },
            });

            index = if closing_index < lines.len() { closing_index + 1 } else { lines.len() };
            continue;
        }

        if let Some((level, prefix_len)) = parse_heading(line.text) {
            let content_offset = line.start + prefix_len;
            let content = &markdown[content_offset..line.end];
            blocks.push(BlockNode {
                node_id: id_gen.next(),
                range: TextRange::new(line.start as u32, line.end as u32),
                kind: BlockKind::Heading {
                    level,
                    inlines: parse_inlines(content, content_offset, &mut id_gen),
                },
            });
            index += 1;
            continue;
        }

        if parse_blockquote(line.text).is_some() {
            let mut children = Vec::new();
            let quote_start = line.start;
            let mut quote_end = line.end;

            while index < lines.len() {
                let current = lines[index];
                let Some(prefix_len) = parse_blockquote(current.text) else {
                    break;
                };
                let content_offset = current.start + prefix_len;
                let content = &markdown[content_offset..current.end];
                children.push(BlockNode {
                    node_id: id_gen.next(),
                    range: TextRange::new(current.start as u32, current.end as u32),
                    kind: BlockKind::Paragraph {
                        inlines: parse_inlines(content, content_offset, &mut id_gen),
                    },
                });
                quote_end = current.end_with_newline;
                index += 1;
            }

            blocks.push(BlockNode {
                node_id: id_gen.next(),
                range: TextRange::new(quote_start as u32, quote_end as u32),
                kind: BlockKind::Blockquote { children },
            });
            continue;
        }

        if parse_bullet_marker(line.text).is_some() {
            let list_start = line.start;
            let mut list_end = line.end;
            let mut items = Vec::new();

            while index < lines.len() {
                let current = lines[index];
                let Some(prefix_len) = parse_bullet_marker(current.text) else {
                    break;
                };
                let content_offset = current.start + prefix_len;
                let content = &markdown[content_offset..current.end];
                let child = BlockNode {
                    node_id: id_gen.next(),
                    range: TextRange::new(current.start as u32, current.end as u32),
                    kind: BlockKind::Paragraph {
                        inlines: parse_inlines(content, content_offset, &mut id_gen),
                    },
                };
                items.push(ListItemNode {
                    node_id: id_gen.next(),
                    range: TextRange::new(current.start as u32, current.end as u32),
                    children: vec![child],
                });
                list_end = current.end_with_newline;
                index += 1;
            }

            blocks.push(BlockNode {
                node_id: id_gen.next(),
                range: TextRange::new(list_start as u32, list_end as u32),
                kind: BlockKind::BulletList { items },
            });
            continue;
        }

        if let Some((start_number, _)) = parse_ordered_marker(line.text) {
            let list_start = line.start;
            let mut list_end = line.end;
            let mut items = Vec::new();
            let mut next_number = start_number;

            while index < lines.len() {
                let current = lines[index];
                let Some((_number, prefix_len)) = parse_ordered_marker(current.text) else {
                    break;
                };
                let content_offset = current.start + prefix_len;
                let content = &markdown[content_offset..current.end];
                let child = BlockNode {
                    node_id: id_gen.next(),
                    range: TextRange::new(current.start as u32, current.end as u32),
                    kind: BlockKind::Paragraph {
                        inlines: parse_inlines(content, content_offset, &mut id_gen),
                    },
                };
                items.push(ListItemNode {
                    node_id: id_gen.next(),
                    range: TextRange::new(current.start as u32, current.end as u32),
                    children: vec![child],
                });
                next_number += 1;
                list_end = current.end_with_newline;
                index += 1;
            }

            let list_start_number =
                start_number.max(next_number.saturating_sub(items.len() as u32));
            blocks.push(BlockNode {
                node_id: id_gen.next(),
                range: TextRange::new(list_start as u32, list_end as u32),
                kind: BlockKind::OrderedList { start: list_start_number, items },
            });
            continue;
        }

        let paragraph_start = line.start;
        let mut paragraph_end = line.end;
        let mut next_index = index + 1;

        while next_index < lines.len() {
            let current = lines[next_index];
            if current.text.trim().is_empty()
                || parse_fence_open(current.text).is_some()
                || parse_heading(current.text).is_some()
                || parse_blockquote(current.text).is_some()
                || parse_bullet_marker(current.text).is_some()
                || parse_ordered_marker(current.text).is_some()
            {
                break;
            }
            paragraph_end = current.end;
            next_index += 1;
        }

        let content = &markdown[paragraph_start..paragraph_end];
        blocks.push(BlockNode {
            node_id: id_gen.next(),
            range: TextRange::new(paragraph_start as u32, paragraph_end as u32),
            kind: BlockKind::Paragraph {
                inlines: parse_inlines(content, paragraph_start, &mut id_gen),
            },
        });
        index = next_index;
    }

    blocks
}

fn parse_inlines(text: &str, base_offset: usize, id_gen: &mut NodeIdGenerator) -> Vec<InlineNode> {
    let mut nodes = Vec::new();
    let mut cursor = 0;
    let mut literal_start = 0;

    while cursor < text.len() {
        let rest = &text[cursor..];

        if rest.starts_with("**") {
            if let Some(close_rel) = rest[2..].find("**") {
                push_text_segment(&mut nodes, text, literal_start, cursor, base_offset, id_gen);
                let inner_start = cursor + 2;
                let inner_end = inner_start + close_rel;
                let children =
                    parse_inlines(&text[inner_start..inner_end], base_offset + inner_start, id_gen);
                nodes.push(InlineNode {
                    node_id: id_gen.next(),
                    range: TextRange::new(
                        (base_offset + inner_start) as u32,
                        (base_offset + inner_end) as u32,
                    ),
                    kind: InlineKind::Strong { children },
                });
                cursor = inner_end + 2;
                literal_start = cursor;
                continue;
            }
        }

        if rest.starts_with('*') {
            if let Some(close_rel) = rest[1..].find('*') {
                push_text_segment(&mut nodes, text, literal_start, cursor, base_offset, id_gen);
                let inner_start = cursor + 1;
                let inner_end = inner_start + close_rel;
                let children =
                    parse_inlines(&text[inner_start..inner_end], base_offset + inner_start, id_gen);
                nodes.push(InlineNode {
                    node_id: id_gen.next(),
                    range: TextRange::new(
                        (base_offset + inner_start) as u32,
                        (base_offset + inner_end) as u32,
                    ),
                    kind: InlineKind::Emphasis { children },
                });
                cursor = inner_end + 1;
                literal_start = cursor;
                continue;
            }
        }

        if rest.starts_with('`') {
            if let Some(close_rel) = rest[1..].find('`') {
                push_text_segment(&mut nodes, text, literal_start, cursor, base_offset, id_gen);
                let inner_start = cursor + 1;
                let inner_end = inner_start + close_rel;
                nodes.push(InlineNode {
                    node_id: id_gen.next(),
                    range: TextRange::new(
                        (base_offset + inner_start) as u32,
                        (base_offset + inner_end) as u32,
                    ),
                    kind: InlineKind::InlineCode {
                        value: text[inner_start..inner_end].to_string(),
                    },
                });
                cursor = inner_end + 1;
                literal_start = cursor;
                continue;
            }
        }

        if rest.starts_with('[') {
            if let Some(close_bracket) = rest.find(']') {
                let after_bracket = cursor + close_bracket + 1;
                if text[after_bracket..].starts_with('(') {
                    if let Some(close_paren_rel) = text[after_bracket + 1..].find(')') {
                        push_text_segment(
                            &mut nodes,
                            text,
                            literal_start,
                            cursor,
                            base_offset,
                            id_gen,
                        );
                        let label_start = cursor + 1;
                        let label_end = cursor + close_bracket;
                        let href_start = after_bracket + 1;
                        let href_end = href_start + close_paren_rel;
                        let children = parse_inlines(
                            &text[label_start..label_end],
                            base_offset + label_start,
                            id_gen,
                        );
                        nodes.push(InlineNode {
                            node_id: id_gen.next(),
                            range: TextRange::new(
                                (base_offset + label_start) as u32,
                                (base_offset + href_end + 1) as u32,
                            ),
                            kind: InlineKind::Link {
                                href: text[href_start..href_end].to_string(),
                                title: None,
                                children,
                            },
                        });
                        cursor = href_end + 1;
                        literal_start = cursor;
                        continue;
                    }
                }
            }
        }

        let ch = rest.chars().next().unwrap_or_default();
        cursor += ch.len_utf8();
    }

    push_text_segment(&mut nodes, text, literal_start, text.len(), base_offset, id_gen);
    nodes
}

fn push_text_segment(
    nodes: &mut Vec<InlineNode>,
    text: &str,
    start: usize,
    end: usize,
    base_offset: usize,
    id_gen: &mut NodeIdGenerator,
) {
    if start >= end {
        return;
    }

    nodes.push(InlineNode {
        node_id: id_gen.next(),
        range: TextRange::new((base_offset + start) as u32, (base_offset + end) as u32),
        kind: InlineKind::Text { value: text[start..end].to_string() },
    });
}

fn scan_lines(markdown: &str) -> Vec<Line<'_>> {
    let mut lines = Vec::new();
    let mut start = 0;

    while start < markdown.len() {
        if let Some(rel_end) = markdown[start..].find('\n') {
            let end = start + rel_end;
            lines.push(Line { start, end, end_with_newline: end + 1, text: &markdown[start..end] });
            start = end + 1;
        } else {
            lines.push(Line {
                start,
                end: markdown.len(),
                end_with_newline: markdown.len(),
                text: &markdown[start..],
            });
            start = markdown.len();
        }
    }

    if markdown.is_empty() {
        lines.push(Line { start: 0, end: 0, end_with_newline: 0, text: "" });
    }

    lines
}

fn parse_heading(line: &str) -> Option<(u8, usize)> {
    let hashes = line.chars().take_while(|ch| *ch == '#').count();
    if hashes == 0 || hashes > 6 {
        return None;
    }

    if line.as_bytes().get(hashes) != Some(&b' ') {
        return None;
    }

    Some((hashes as u8, hashes + 1))
}

fn parse_blockquote(line: &str) -> Option<usize> {
    if line.starts_with("> ") {
        Some(2)
    } else if line == ">" {
        Some(1)
    } else {
        None
    }
}

fn parse_bullet_marker(line: &str) -> Option<usize> {
    let bytes = line.as_bytes();
    if bytes.len() >= 2 && matches!(bytes[0], b'-' | b'*' | b'+') && bytes[1] == b' ' {
        Some(2)
    } else {
        None
    }
}

fn parse_ordered_marker(line: &str) -> Option<(u32, usize)> {
    let digit_count = line.chars().take_while(|ch| ch.is_ascii_digit()).count();
    if digit_count == 0 {
        return None;
    }

    let suffix = line.get(digit_count..)?;
    if !suffix.starts_with(". ") {
        return None;
    }

    let number = line[..digit_count].parse::<u32>().ok()?;
    Some((number, digit_count + 2))
}

fn parse_fence_open(line: &str) -> Option<(Option<String>, usize)> {
    let fence = line.strip_prefix("```")?;
    Some((normalize_code_language(fence), 3))
}

fn is_closing_fence(line: &str, fence_len: usize) -> bool {
    line.trim() == "`".repeat(fence_len)
}
