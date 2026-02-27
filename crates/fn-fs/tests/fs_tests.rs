use std::fs;

use fn_core::WorkspaceEntryKind;
use fn_fs::{list_workspace_entries, open_file, save_as_file, save_file, FsError};
use tempfile::tempdir;

#[cfg(unix)]
use std::os::unix::fs::symlink;

#[test]
fn save_file_returns_conflict_when_expected_version_is_stale() {
    let dir = tempdir().expect("tempdir should be created");
    let path = dir.path().join("doc.md");

    fs::write(&path, "first").expect("seed file should be written");
    let open = open_file(path.to_str().expect("path must be utf-8")).expect("open should work");

    fs::write(&path, "external change").expect("external write should work");
    let save = save_file(path.to_str().expect("path must be utf-8"), "local draft", open.version)
        .expect("save should return conflict payload");

    assert!(save.conflict);
    assert_eq!(save.bytes_written, 0);
}

#[test]
fn save_as_file_writes_content_atomically() {
    let dir = tempdir().expect("tempdir should be created");
    let path = dir.path().join("fresh.md");

    let save = save_as_file(path.to_str().expect("path must be utf-8"), "hello markdown")
        .expect("save_as should succeed");

    assert!(!save.conflict);
    assert!(save.bytes_written > 0);
    let current = fs::read_to_string(path).expect("file should be readable");
    assert_eq!(current, "hello markdown");
}

#[test]
fn open_file_rejects_directory_path() {
    let dir = tempdir().expect("tempdir should be created");
    let err = open_file(dir.path().to_str().expect("path must be utf-8"))
        .expect_err("directory path must fail");

    assert!(matches!(err, FsError::IsDirectory(_)));
}

#[test]
fn save_as_file_rejects_empty_path() {
    let err = save_as_file("", "draft").expect_err("empty path should fail");
    assert!(matches!(err, FsError::EmptyPath));
}

#[test]
fn save_as_file_rejects_missing_parent_directory() {
    let dir = tempdir().expect("tempdir should be created");
    let path = dir.path().join("missing").join("doc.md");

    let err = save_as_file(path.to_str().expect("path must be utf-8"), "draft")
        .expect_err("missing parent should fail");

    assert!(matches!(err, FsError::InvalidPath(_)));
}

#[test]
fn list_workspace_entries_filters_and_sorts_markdown_entries() {
    let dir = tempdir().expect("tempdir should be created");
    let root = dir.path().join("workspace");
    fs::create_dir_all(root.join("zeta-dir")).expect("zeta-dir should be created");
    fs::create_dir_all(root.join("alpha-dir")).expect("alpha-dir should be created");
    fs::write(root.join("note.md"), "hello").expect("note.md should exist");
    fs::write(root.join("guide.markdown"), "hello").expect("guide.markdown should exist");
    fs::write(root.join("readme.txt"), "skip").expect("readme.txt should exist");

    let listed = list_workspace_entries(root.to_str().expect("root path must be utf-8"), None)
        .expect("listing should succeed");

    assert_eq!(listed.current_relative_path, "");
    let names = listed.entries.iter().map(|entry| entry.name.as_str()).collect::<Vec<_>>();
    assert_eq!(names, vec!["alpha-dir", "zeta-dir", "guide.markdown", "note.md"]);
    assert_eq!(listed.entries[0].kind, WorkspaceEntryKind::Directory);
    assert_eq!(listed.entries[2].kind, WorkspaceEntryKind::Markdown);
}

#[test]
fn list_workspace_entries_rejects_out_of_workspace_relative_path() {
    let dir = tempdir().expect("tempdir should be created");
    let root = dir.path().join("workspace");
    let outside = dir.path().join("outside");
    fs::create_dir_all(&root).expect("workspace should be created");
    fs::create_dir_all(&outside).expect("outside should be created");

    let err =
        list_workspace_entries(root.to_str().expect("root path must be utf-8"), Some("../outside"))
            .expect_err("relative path escape should fail");

    assert!(matches!(err, FsError::OutOfWorkspace(_)));
}

#[test]
fn list_workspace_entries_rejects_non_directory_workspace_root() {
    let dir = tempdir().expect("tempdir should be created");
    let root_file = dir.path().join("workspace.md");
    fs::write(&root_file, "not a directory").expect("root file should be created");

    let err = list_workspace_entries(root_file.to_str().expect("root path must be utf-8"), None)
        .expect_err("file root should fail");

    assert!(matches!(err, FsError::InvalidPath(_)));
}

#[cfg(unix)]
#[test]
fn list_workspace_entries_keeps_symlink_alias_for_current_relative_path() {
    let dir = tempdir().expect("tempdir should be created");
    let root = dir.path().join("workspace");
    let docs = root.join("docs");
    let alias = root.join("link");

    fs::create_dir_all(&docs).expect("docs should be created");
    fs::write(docs.join("note.md"), "hello").expect("note.md should be created");
    symlink(&docs, &alias).expect("symlink should be created");

    let listed =
        list_workspace_entries(root.to_str().expect("root path must be utf-8"), Some("link"))
            .expect("listing through symlink alias should succeed");

    assert_eq!(listed.current_relative_path, "link");
    assert_eq!(listed.entries.len(), 1);
    assert_eq!(listed.entries[0].relative_path, "link/note.md");
}
