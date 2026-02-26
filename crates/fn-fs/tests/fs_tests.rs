use std::fs;

use fn_fs::{open_file, save_as_file, save_file, FsError};
use tempfile::tempdir;

#[test]
fn save_file_returns_conflict_when_expected_version_is_stale() {
    let dir = tempdir().expect("tempdir should be created");
    let path = dir.path().join("doc.md");

    fs::write(&path, "first").expect("seed file should be written");
    let open = open_file(path.to_str().expect("path must be utf-8")).expect("open should work");

    fs::write(&path, "external change").expect("external write should work");
    let save = save_file(
        path.to_str().expect("path must be utf-8"),
        "local draft",
        open.version,
    )
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
