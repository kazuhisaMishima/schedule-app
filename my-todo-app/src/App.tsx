import { useState, useRef } from 'react';
import './App.css'
import { useSchedules } from './hooks/useSchedules';
import { useTemplates } from './hooks/useTemplates';
import { useDefaultTasks } from './hooks/useDefaultTasks';
import { exportAllDataToJSON, importFromJSON } from './utils/storage';
import { AppHeader } from './components/AppHeader';
import { ScheduleList } from './components/ScheduleList';
import { Sidebar } from './components/Sidebar';
import type { SidePanel } from './components/Sidebar';

function App() {
  const [activePanel, setActivePanel] = useState<SidePanel>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    currentDate,
    changeDate,
    schedules,
    setSchedules,
    sortedSchedules,
    completedCount,
    mustCount,
    editingId,
    setEditingId,
    editForm,
    setEditForm,
    insertAfterId,
    setInsertAfterId,
    handleConfirmInsert,
    handleEditSchedule,
    handleSaveEdit,
    handleDeleteSchedule,
    handleToggleCompleted,
    handleUpdateProgress,
    handleUpdateNotes,
    handleReorder,
    handleSaveArchive,
    handleLoadArchive,
  } = useSchedules();

  const {
    templates,
    templateName,
    setTemplateName,
    handleSaveTemplate,
    handleApplyTemplate,
    handleDeleteTemplate,
  } = useTemplates();

  const {
    editingDefaults,
    setEditingDefaults,
    saveDefaults,
    resetDefaults,
  } = useDefaultTasks();

  const handleExportData = () => {
    try {
      const jsonData = exportAllDataToJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedules-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('データをダウンロードしました！');
    } catch (error) {
      alert(`エクスポートエラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonText = e.target?.result as string;
        const result = importFromJSON(jsonText);
        if (result.success) {
          alert(result.message);
          // ページリロードでデータを反映
          window.location.reload();
        } else {
          alert(result.message);
        }
      } catch (error) {
        alert(`読み込みエラー: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    reader.readAsText(file);

    // 同じファイルを再度選択できるようにリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        templates={templates}
        templateName={templateName}
        setTemplateName={setTemplateName}
        onSaveTemplate={() => handleSaveTemplate(schedules)}
        onApplyTemplate={t => handleApplyTemplate(t, setSchedules, schedules)}
        onDeleteTemplate={handleDeleteTemplate}
        currentDate={currentDate}
        onSaveArchive={handleSaveArchive}
        onLoadArchive={handleLoadArchive}
        onExportData={handleExportData}
        onImportData={handleImportData}
        fileInputRef={fileInputRef}
        editingDefaults={editingDefaults}
        setEditingDefaults={setEditingDefaults}
        onSaveDefaults={saveDefaults}
        onResetDefaults={resetDefaults}
      />

      <main className="main-content">
        <AppHeader
          currentDate={currentDate}
          changeDate={changeDate}
          totalCount={schedules.length}
          completedCount={completedCount}
          mustCount={mustCount}
        />

        <ScheduleList
          sortedSchedules={sortedSchedules}
          insertAfterId={insertAfterId}
          setInsertAfterId={setInsertAfterId}
          onConfirmInsert={handleConfirmInsert}
          editingId={editingId}
          editForm={editForm}
          setEditForm={setEditForm}
          onToggleCompleted={handleToggleCompleted}
          onUpdateProgress={handleUpdateProgress}
          onEditSchedule={handleEditSchedule}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingId(null)}
          onDeleteSchedule={handleDeleteSchedule}
          onUpdateNotes={handleUpdateNotes}
          onReorder={handleReorder}
        />
      </main>
    </div>
  );
}

export default App;
