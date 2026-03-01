use serde::{Deserialize, Serialize};

use crate::{
    ast::{BlockKind, BlockNode, InlineKind, InlineNode, NodeId},
    selection::{Selection, TextRange},
    Doc,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EditorSnapshot {
    pub revision: u64,
    pub markdown: String,
    pub blocks: Vec<RenderBlock>,
    pub selection: Selection,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RenderBlock {
    pub node_id: NodeId,
    pub kind: RenderBlockKind,
    pub children: Vec<RenderInline>,
    pub attrs: RenderAttrs,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RenderBlockKind {
    Paragraph,
    Heading,
    BlockquoteParagraph,
    BulletListItem,
    OrderedListItem,
    FencedCode,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RenderInline {
    pub node_id: NodeId,
    pub kind: RenderInlineKind,
    pub text: Option<String>,
    pub range: TextRange,
    pub children: Vec<RenderInline>,
    pub attrs: RenderAttrs,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RenderInlineKind {
    Text,
    Strong,
    Emphasis,
    InlineCode,
    Link,
    CodeText,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct RenderAttrs {
    pub heading_level: Option<u8>,
    pub href: Option<String>,
    pub title: Option<String>,
    pub language: Option<String>,
    pub class_name: Option<String>,
    pub start_utf8: Option<u32>,
    pub end_utf8: Option<u32>,
    pub list_index: Option<u32>,
    pub raw_markdown: Option<String>,
}

pub fn build_snapshot(doc: &Doc, selection: Selection) -> EditorSnapshot {
    let mut render_blocks = Vec::new();
    for block in &doc.blocks {
        flatten_block(block, doc.text.as_str(), &mut render_blocks);
    }

    EditorSnapshot {
        revision: doc.revision,
        markdown: doc.text.to_string(),
        blocks: render_blocks,
        selection,
    }
}

fn flatten_block(block: &BlockNode, markdown: &str, out: &mut Vec<RenderBlock>) {
    match &block.kind {
        BlockKind::Paragraph { inlines } => out.push(RenderBlock {
            node_id: block.node_id,
            kind: RenderBlockKind::Paragraph,
            children: render_inlines(inlines),
            attrs: range_attrs(block.range, markdown),
        }),
        BlockKind::Heading { level, inlines } => out.push(RenderBlock {
            node_id: block.node_id,
            kind: RenderBlockKind::Heading,
            children: render_inlines(inlines),
            attrs: RenderAttrs {
                heading_level: Some(*level),
                ..range_attrs(block.range, markdown)
            },
        }),
        BlockKind::Blockquote { children } => {
            for child in children {
                let inlines = match &child.kind {
                    BlockKind::Paragraph { inlines } | BlockKind::Heading { inlines, .. } => {
                        render_inlines(inlines)
                    }
                    _ => Vec::new(),
                };
                out.push(RenderBlock {
                    node_id: child.node_id,
                    kind: RenderBlockKind::BlockquoteParagraph,
                    children: inlines,
                    attrs: range_attrs(child.range, markdown),
                });
            }
        }
        BlockKind::BulletList { items } => {
            for item in items {
                if let Some(first) = item.children.first() {
                    let inlines = match &first.kind {
                        BlockKind::Paragraph { inlines } | BlockKind::Heading { inlines, .. } => {
                            render_inlines(inlines)
                        }
                        _ => Vec::new(),
                    };
                    out.push(RenderBlock {
                        node_id: item.node_id,
                        kind: RenderBlockKind::BulletListItem,
                        children: inlines,
                        attrs: range_attrs(item.range, markdown),
                    });
                }
            }
        }
        BlockKind::OrderedList { start, items } => {
            for (offset, item) in items.iter().enumerate() {
                if let Some(first) = item.children.first() {
                    let inlines = match &first.kind {
                        BlockKind::Paragraph { inlines } | BlockKind::Heading { inlines, .. } => {
                            render_inlines(inlines)
                        }
                        _ => Vec::new(),
                    };
                    out.push(RenderBlock {
                        node_id: item.node_id,
                        kind: RenderBlockKind::OrderedListItem,
                        children: inlines,
                        attrs: RenderAttrs {
                            list_index: Some(*start + offset as u32),
                            ..range_attrs(item.range, markdown)
                        },
                    });
                }
            }
        }
        BlockKind::FencedCode { language, text_range, code } => out.push(RenderBlock {
            node_id: block.node_id,
            kind: RenderBlockKind::FencedCode,
            children: vec![RenderInline {
                node_id: block.node_id,
                kind: RenderInlineKind::CodeText,
                text: Some(code.clone()),
                range: *text_range,
                children: Vec::new(),
                attrs: RenderAttrs {
                    language: language.clone(),
                    ..range_attrs(*text_range, markdown)
                },
            }],
            attrs: RenderAttrs { language: language.clone(), ..range_attrs(block.range, markdown) },
        }),
    }
}

fn render_inlines(inlines: &[InlineNode]) -> Vec<RenderInline> {
    inlines.iter().map(render_inline).collect()
}

fn render_inline(inline: &InlineNode) -> RenderInline {
    match &inline.kind {
        InlineKind::Text { value } => RenderInline {
            node_id: inline.node_id,
            kind: RenderInlineKind::Text,
            text: Some(value.clone()),
            range: inline.range,
            children: Vec::new(),
            attrs: range_attrs(inline.range, value),
        },
        InlineKind::Strong { children } => RenderInline {
            node_id: inline.node_id,
            kind: RenderInlineKind::Strong,
            text: None,
            range: inline.range,
            children: render_inlines(children),
            attrs: range_attrs(inline.range, ""),
        },
        InlineKind::Emphasis { children } => RenderInline {
            node_id: inline.node_id,
            kind: RenderInlineKind::Emphasis,
            text: None,
            range: inline.range,
            children: render_inlines(children),
            attrs: range_attrs(inline.range, ""),
        },
        InlineKind::InlineCode { value } => RenderInline {
            node_id: inline.node_id,
            kind: RenderInlineKind::InlineCode,
            text: Some(value.clone()),
            range: inline.range,
            children: Vec::new(),
            attrs: range_attrs(inline.range, value),
        },
        InlineKind::Link { href, title, children } => RenderInline {
            node_id: inline.node_id,
            kind: RenderInlineKind::Link,
            text: None,
            range: inline.range,
            children: render_inlines(children),
            attrs: RenderAttrs {
                href: Some(href.clone()),
                title: title.clone(),
                ..range_attrs(inline.range, "")
            },
        },
    }
}

fn range_attrs(range: TextRange, raw_markdown: &str) -> RenderAttrs {
    let start = range.start_utf8 as usize;
    let end = range.end_utf8 as usize;
    let slice = raw_markdown.get(start..end).map(ToString::to_string).unwrap_or_default();

    RenderAttrs {
        start_utf8: Some(range.start_utf8),
        end_utf8: Some(range.end_utf8),
        raw_markdown: Some(slice),
        ..RenderAttrs::default()
    }
}
