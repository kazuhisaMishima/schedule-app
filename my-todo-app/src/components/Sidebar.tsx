import type { Dispatch, SetStateAction, RefObject } from 'react';
import type { ScheduleTemplate, DefaultTaskDef } from '../types/schedule';

export type SidePanel = 'template' | 'save' | 'settings' | null;

interface SidebarProps {
  activePanel: SidePanel;
  setActivePanel: Dispatch<SetStateAction<SidePanel>>;
  // テンプレートパネル
  templates: ScheduleTemplate[];
  templateName: string;
  setTemplateName: Dispatch<SetStateAction<string>>;
  onSaveTemplate: () => void;
  onApplyTemplate: (template: ScheduleTemplate) => void;
  onDeleteTemplate: (id: number) => void;
  // 保存パネル
  currentDate: Date;
  onSaveArchive: () => void;
  onLoadArchive: () => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  // 設定パネル
  editingDefaults: DefaultTaskDef[];
  setEditingDefaults: Dispatch<SetStateAction<DefaultTaskDef[]>>;
  onSaveDefaults: () => void;
  onResetDefaults: () => void;
}

export function Sidebar({
  activePanel,
  setActivePanel,
  templates,
  templateName,
  setTemplateName,
  onSaveTemplate,
  onApplyTemplate,
  onDeleteTemplate,
  currentDate,
  onSaveArchive,
  onLoadArchive,
  onExportData,
  onImportData,
  fileInputRef,
  editingDefaults,
  setEditingDefaults,
  onSaveDefaults,
  onResetDefaults,
}: SidebarProps) {
  const togglePanel = (panel: SidePanel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  return (
    <aside className={`sidebar${activePanel ? ' expanded' : ''}`}>
      <nav className="sidebar-nav">
        <button
          className={`nav-item${activePanel === 'template' ? ' active' : ''}`}
          onClick={() => togglePanel('template')}
          title="テンプレート"
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">テンプレート</span>
        </button>
        <button
          className={`nav-item${activePanel === 'save' ? ' active' : ''}`}
          onClick={() => togglePanel('save')}
          title="保存"
        >
          <span className="nav-icon">💾</span>
          <span className="nav-label">保存</span>
        </button>
        <button
          className={`nav-item${activePanel === 'settings' ? ' active' : ''}`}
          onClick={() => togglePanel('settings')}
          title="設定"
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">設定</span>
        </button>
      </nav>

      {activePanel && (
        <div className="sidebar-panel">
          {activePanel === 'template' && (
            <div className="sub-section">
              <div className="sub-section-header">
                <h3>テンプレート</h3>
                <button className="panel-close-btn" onClick={() => setActivePanel(null)}>✕</button>
              </div>
              <div className="sub-row">
                <input
                  className="sub-input"
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="テンプレート名"
                />
                <button onClick={onSaveTemplate} className="sub-btn">保存</button>
              </div>
              {templates.length === 0 && <p className="sub-empty">テンプレートはまだありません</p>}
              <div className="template-list">
                {templates.map(t => (
                  <div key={t.id} className="template-item">
                    <div className="template-item-info">
                      <span className="template-item-name">{t.name}</span>
                      <span className="template-item-count">{t.schedules.length}タスク</span>
                    </div>
                    <div className="template-item-actions">
                      <button onClick={() => onApplyTemplate(t)} className="sub-btn-small">適用</button>
                      <button onClick={() => onDeleteTemplate(t.id)} className="sub-btn-small danger">削除</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePanel === 'save' && (
            <div className="sub-section">
              <div className="sub-section-header">
                <h3>保存</h3>
                <button className="panel-close-btn" onClick={() => setActivePanel(null)}>✕</button>
              </div>
              <p className="sub-date">{currentDate.toLocaleDateString('ja-JP')}</p>
              <h4 className="sub-heading">アーカイブ（LocalStorage）</h4>
              <div className="sub-row vertical">
                <button onClick={onSaveArchive} className="sub-btn full">
                  💾 現在の状態を保存
                </button>
                <button onClick={onLoadArchive} className="sub-btn full outline">
                  📂 保存データを読み込む
                </button>
              </div>
              <h4 className="sub-heading" style={{ marginTop: '12px' }}>バックアップ（ファイル）</h4>
              <p className="sub-hint">全データを JSON ファイルでバックアップできます</p>
              <div className="sub-row vertical">
                <button onClick={onExportData} className="sub-btn full">
                  ⬇️ データをダウンロード
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="sub-btn full outline"
                >
                  ⬆️ ファイルからインポート
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          {activePanel === 'settings' && (
            <div className="sub-section">
              <div className="sub-section-header">
                <h3>設定</h3>
                <button className="panel-close-btn" onClick={() => setActivePanel(null)}>✕</button>
              </div>
              <h4 className="sub-heading">初期タスク設定</h4>
              <p className="sub-hint">新しい日に自動で作成されるタスクを設定します</p>
              <div className="default-task-list">
                {editingDefaults.map((d, i) => (
                  <div key={i} className="default-task-item">
                    <input
                      className="sub-input default-task-title"
                      value={d.title}
                      onChange={e => {
                        const updated = [...editingDefaults];
                        updated[i] = { ...d, title: e.target.value };
                        setEditingDefaults(updated);
                      }}
                      placeholder="タスク名"
                    />
                    <div className="default-task-times">
                      <input
                        className="sub-input time-mini"
                        type="time"
                        value={d.startTime}
                        onChange={e => {
                          const updated = [...editingDefaults];
                          updated[i] = { ...d, startTime: e.target.value };
                          setEditingDefaults(updated);
                        }}
                      />
                      <span>〜</span>
                      <input
                        className="sub-input time-mini"
                        type="time"
                        value={d.endTime}
                        onChange={e => {
                          const updated = [...editingDefaults];
                          updated[i] = { ...d, endTime: e.target.value };
                          setEditingDefaults(updated);
                        }}
                      />
                    </div>
                    <div className="default-task-footer">
                      <label className="default-task-required">
                        <input
                          type="checkbox"
                          checked={d.isRequired}
                          onChange={e => {
                            const updated = [...editingDefaults];
                            updated[i] = { ...d, isRequired: e.target.checked };
                            setEditingDefaults(updated);
                          }}
                        />
                        マスト
                      </label>
                      <button
                        className="sub-btn-small danger"
                        onClick={() => setEditingDefaults(prev => prev.filter((_, j) => j !== i))}
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="sub-btn full"
                style={{ marginTop: '8px' }}
                onClick={() => setEditingDefaults(prev => [
                  ...prev,
                  { title: 'タスク', startTime: '09:00', endTime: '10:00', isRequired: true }
                ])}
              >＋ タスクを追加</button>
              <div className="sub-row" style={{ marginTop: '12px' }}>
                <button className="sub-btn" onClick={onSaveDefaults}>保存</button>
                <button className="sub-btn outline" onClick={onResetDefaults}>リセット</button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

