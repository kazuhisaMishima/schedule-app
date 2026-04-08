# CLAUDE.md

## プロジェクト概要

日本語対応のスケジュール管理 SPA。タスクの時間帯・進捗・完了状態を管理する。バックエンドなし、データは LocalStorage に永続化。

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|----------|
| フロントエンド | React | 19.2.4 |
| ビルドツール | Vite | 8.0.4 |
| 言語 | TypeScript | 6.0.2 |
| リンティング | ESLint | 9.39.4 |
| ターゲット | ES2023 | - |

## ディレクトリ構造

```
src/
├── App.tsx              # メインコンポーネント（全機能を集約）
├── App.css              # アプリスタイル
├── main.tsx             # エントリーポイント（ErrorBoundary あり）
├── index.css            # グローバルスタイル
├── ErrorBoundary.tsx    # エラーバウンダリ
└── types/
    └── schedule.ts      # 型定義（Schedule / ScheduleTemplate）
```

## 開発コマンド

```bash
npm run dev       # 開発サーバー起動
npm run build     # 型チェック + プロダクションビルド
npm run lint      # ESLint チェック
npm run preview   # ビルド後のプレビュー
```

## アーキテクチャ・設計方針

- **状態管理**: React Hooks（useState / useEffect）のみ、外部ライブラリなし
- **データ永続化**: LocalStorage（日次アーカイブ対応）
- **スタイリング**: 純粋 CSS（Tailwind 等未使用）
- **UI言語**: 全て日本語で統一

## 型定義

- `src/types/schedule.ts` に `Schedule` / `ScheduleTemplate` インターフェース定義
- 新しい型はこのファイルに追加する

## コーディング規約

- TypeScript strict モード（`noUnusedLocals`, `noUnusedParameters` 有効）
- ESLint flat config（`eslint.config.js`）でルール管理
- コンポーネントは関数コンポーネント + Hooks で実装
- UIテキストは日本語で統一

## コミュニケーション

- 日本語で応答する（コード・変数名は英語）
- 簡潔に回答し、自明な説明は省略する
- 複雑なタスクでは実装前に計画を提示し、承認後に着手する

## コードスタイル

- 関数型アプローチを優先し、副作用を最小化する
- 厳密な型付け（`any` は使わず `unknown` を使う）
- エラーは握りつぶさず、意味のあるメッセージ付きで処理する

## Git規約

- Conventional Commits形式、本文は日本語（例: `feat: ユーザー認証にOAuth2を追加`）
- 確認なしに自動コミット・自動pushしない

## 禁止事項

- README・ドキュメントを勝手に生成・変更しない
- テストコードを確認なしに削除・コメントアウトしない
- 既存の動作するコードを理由なくリファクタリングしない

## 開発ワークフロー

複雑なタスクは以下の順で進める:
1. **Research** — 既存コードを読み、再利用できる実装を探す
2. **Plan** — 実装方針を提示し、承認を得る（プランモード活用）
3. **Execute** — 承認された計画に従って実装する
4. **Review** — `npm run lint` と `npm run build` でエラーがないことを確認する
5. **Ship** — 機能・ファイル単位で個別にコミットする（まとめない）

## コンテキスト管理

- コンテキスト使用量が約50%になったら `/compact` を実行する
- 問題が発生した場合は `/doctor` で診断する
- この CLAUDE.md は200行以内に保つ

## 注意点

- React 19 の新機能（`use` hook 等）は利用可能
- `erasableSyntaxOnly: true` のため `enum` は使用不可 → union type で代替
- バックエンド・API・外部 DB なし → LocalStorage が唯一のデータストア
- `vite.config.ts` の `server.host: true` によりリモートアクセス対応済み
