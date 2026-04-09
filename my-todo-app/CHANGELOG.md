# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-04-09

### Added
- タスクのドラッグ&ドロップによる手動並び替え（`order` フィールドで永続化）
- タスク完了時のアニメーション（チェックボックスバウンス・背景グリーン遷移）
- 現在時刻のタスクハイライト（アンバー色ボーダー＋パルスアニメーション、30秒ごと更新）

### Changed
- 日付欄の曜日表示位置を日付テキスト直後（カレンダーアイコンの左）に変更
- カレンダーアイコンを独自ボタン（📅）に置き換え、ネイティブアイコンを非表示化

## [1.0.0] - 2026-04-09

### Added
- タスクごとのメモ欄（トグルボタンで表示/非表示）
- 日付横への曜日表示（例: 2026-04-09 (水)）
- テンプレート保存・適用機能
- アーカイブ保存・読み込み機能
- デフォルトタスクの編集機能（設定パネル）
- データのエクスポート・インポート（JSON形式）
- タスクの進捗率スライダー
- マスト / 努力目標 の区別

### Changed
- App.tsx を複数のコンポーネント・カスタムHooksに分割してリファクタリング
  - `components/`: AppHeader, Sidebar, ScheduleList, ScheduleItem, InlineInsertForm, TimeSelect
  - `hooks/`: useSchedules, useTemplates, useDefaultTasks
  - `utils/storage.ts`: LocalStorage操作を集約
  - `types/schedule.ts`: 型定義を整理・拡充

### Technical
- React 19 + TypeScript + Vite 構成
- LocalStorage によるデータ永続化（バックエンドなし）
- 日次アーカイブ対応
