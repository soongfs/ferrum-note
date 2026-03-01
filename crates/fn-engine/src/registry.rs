use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct SyntaxPluginDescriptor {
    pub name: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct EnginePluginRegistry {
    pub block_syntax_plugins: Vec<SyntaxPluginDescriptor>,
    pub inline_syntax_plugins: Vec<SyntaxPluginDescriptor>,
    pub input_rule_plugins: Vec<SyntaxPluginDescriptor>,
    pub render_plugins: Vec<SyntaxPluginDescriptor>,
}

impl EnginePluginRegistry {
    pub fn core_markdown() -> Self {
        Self {
            block_syntax_plugins: vec![
                SyntaxPluginDescriptor { name: "heading".to_string() },
                SyntaxPluginDescriptor { name: "blockquote".to_string() },
                SyntaxPluginDescriptor { name: "bullet-list".to_string() },
                SyntaxPluginDescriptor { name: "ordered-list".to_string() },
                SyntaxPluginDescriptor { name: "fenced-code".to_string() },
            ],
            inline_syntax_plugins: vec![
                SyntaxPluginDescriptor { name: "strong".to_string() },
                SyntaxPluginDescriptor { name: "emphasis".to_string() },
                SyntaxPluginDescriptor { name: "inline-code".to_string() },
                SyntaxPluginDescriptor { name: "link".to_string() },
            ],
            input_rule_plugins: vec![
                SyntaxPluginDescriptor { name: "enter".to_string() },
                SyntaxPluginDescriptor { name: "toggle-prefix".to_string() },
            ],
            render_plugins: vec![
                SyntaxPluginDescriptor { name: "heading-scale".to_string() },
                SyntaxPluginDescriptor { name: "code-block-badge".to_string() },
            ],
        }
    }
}
