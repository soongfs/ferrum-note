use fn_engine::{transaction::EngineCommand, Engine};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct EngineHandle {
    engine: Engine,
}

#[wasm_bindgen]
impl EngineHandle {
    #[wasm_bindgen(constructor)]
    pub fn new(markdown: String) -> EngineHandle {
        EngineHandle { engine: Engine::new(markdown) }
    }

    pub fn snapshot(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.engine.snapshot())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    pub fn markdown(&self) -> String {
        self.engine.markdown()
    }

    pub fn set_markdown(&mut self, markdown: String) -> Result<String, JsValue> {
        let snapshot = self.engine.set_markdown(markdown);
        serde_json::to_string(&snapshot).map_err(|error| JsValue::from_str(&error.to_string()))
    }

    pub fn replace_text(
        &mut self,
        start_utf8: u32,
        end_utf8: u32,
        insert: String,
    ) -> Result<String, JsValue> {
        self.engine
            .replace_text(start_utf8, end_utf8, insert)
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        self.snapshot()
    }

    pub fn set_selection(&mut self, anchor_utf8: u32, head_utf8: u32) -> Result<String, JsValue> {
        self.engine
            .set_selection(anchor_utf8, head_utf8)
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        self.snapshot()
    }

    pub fn apply_command(&mut self, command: String) -> Result<String, JsValue> {
        let command = EngineCommand::parse(&command)
            .ok_or_else(|| JsValue::from_str("unsupported command"))?;
        self.engine
            .apply_command(command)
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        self.snapshot()
    }

    pub fn undo(&mut self) -> Result<String, JsValue> {
        self.engine.undo().map_err(|error| JsValue::from_str(&error.to_string())).and_then(
            |snapshot| {
                serde_json::to_string(&snapshot)
                    .map_err(|error| JsValue::from_str(&error.to_string()))
            },
        )
    }

    pub fn redo(&mut self) -> Result<String, JsValue> {
        self.engine.redo().map_err(|error| JsValue::from_str(&error.to_string())).and_then(
            |snapshot| {
                serde_json::to_string(&snapshot)
                    .map_err(|error| JsValue::from_str(&error.to_string()))
            },
        )
    }
}
