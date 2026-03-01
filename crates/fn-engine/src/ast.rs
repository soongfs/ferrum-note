use serde::{Deserialize, Serialize};

use crate::selection::TextRange;

pub type NodeId = u64;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BlockNode {
    pub node_id: NodeId,
    pub range: TextRange,
    pub kind: BlockKind,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum BlockKind {
    Paragraph { inlines: Vec<InlineNode> },
    Heading { level: u8, inlines: Vec<InlineNode> },
    Blockquote { children: Vec<BlockNode> },
    BulletList { items: Vec<ListItemNode> },
    OrderedList { start: u32, items: Vec<ListItemNode> },
    FencedCode { language: Option<String>, text_range: TextRange, code: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ListItemNode {
    pub node_id: NodeId,
    pub range: TextRange,
    pub children: Vec<BlockNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct InlineNode {
    pub node_id: NodeId,
    pub range: TextRange,
    pub kind: InlineKind,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum InlineKind {
    Text { value: String },
    Strong { children: Vec<InlineNode> },
    Emphasis { children: Vec<InlineNode> },
    InlineCode { value: String },
    Link { href: String, title: Option<String>, children: Vec<InlineNode> },
}
