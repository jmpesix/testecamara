'use client';

import React from 'react';
import { usePortalData } from './portal-vereador/usePortalData';
import { Sidebar } from './portal-vereador/Sidebar';
import { ConversationList } from './portal-vereador/ConversationList';
import { ChatWindow } from './portal-vereador/ChatWindow';
import { DashboardReports } from './portal-vereador/DashboardReports';

export default function PortalVereador() {
  const data = usePortalData();

  if (!data.mounted) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#c5a059]/20 border-t-[#c5a059] rounded-full animate-spin" />
          <p className="font-serif italic text-[#0a192f]/60">Carregando painel legislativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-slate-50 overflow-hidden font-sans select-none">
      <Sidebar 
        conversas={data.conversas}
        mainView={data.mainView}
        setMainView={data.setMainView}
        gabinetesExpanded={data.gabinetesExpanded}
        setGabinetesExpanded={data.setGabinetesExpanded}
        selectedVereador={data.selectedVereador}
        setSelectedVereador={data.setSelectedVereador}
        reportsExpanded={data.reportsExpanded}
        setReportsExpanded={data.setReportsExpanded}
        reportTab={data.reportTab}
        setReportTab={data.setReportTab}
        reportSummary={data.reportSummary}
        setSelectedMessage={data.setSelectedMessage}
        setInboxSubFilter={data.setInboxSubFilter}
        userProfile={data.userProfile}
        labels={data.labels}
        selectedLabel={data.selectedLabel}
        setSelectedLabel={data.setSelectedLabel}
        teams={data.teams}
        selectedTeamId={data.selectedTeamId}
        setSelectedTeamId={data.setSelectedTeamId}
      />

      <ConversationList 
        conversas={data.conversas}
        selectedMessage={data.selectedMessage}
        setSelectedMessage={data.setSelectedMessage}
        inboxSubFilter={data.inboxSubFilter}
        setInboxSubFilter={data.setInboxSubFilter}
        mainView={data.mainView}
        selectedVereador={data.selectedVereador}
        inboxFilter={data.inboxFilter}
        loading={data.loading}
        reportSummary={data.reportSummary}
        selectedLabel={data.selectedLabel}
        selectedTeamId={data.selectedTeamId}
      />

      {data.mainView === 'reports' ? (
        <DashboardReports 
          mainView={data.mainView}
          reportTab={data.reportTab}
          setReportTab={data.setReportTab}
          reportRange={data.reportRange}
          setReportRange={data.setReportRange}
          customDateRange={data.customDateRange}
          setCustomDateRange={data.setCustomDateRange}
          reportSummary={data.reportSummary}
          reportDaily={data.reportDaily}
          reportTeams={data.reportTeams}
          reportChannels={data.reportChannels}
          reportDistribution={data.reportDistribution}
          reportConversations={data.reportConversations}
          loadingReports={data.loadingReports}
          teams={data.teams}
          auditLogs={data.auditLogs}
          labels={data.labels}
          loadingLabels={data.loadingLabels}
          fetchLabels={data.fetchLabels}
        />
      ) : (
        <ChatWindow 
          selectedMessage={data.selectedMessage}
          setSelectedMessage={data.setSelectedMessage}
          conversationMessages={data.conversationMessages}
          loadingHistory={data.loadingHistory}
          replyText={data.replyText}
          setReplyText={data.setReplyText}
          isAnalyzing={data.isAnalyzing}
          aiSuggestion={data.aiSuggestion}
          setAiSuggestion={data.setAiSuggestion}
          isSending={data.isSending}
          cannedResponses={data.cannedResponses}
          showCanned={data.showCanned}
          setShowCanned={data.setShowCanned}
          showContactDetails={data.showContactDetails}
          setShowContactDetails={data.setShowContactDetails}
          fullConversationData={data.fullConversationData}
          sidebarOpenSections={data.sidebarOpenSections}
          setSidebarOpenSections={data.setSidebarOpenSections}
          isUpdatingStatus={data.isUpdatingStatus}
          aiInfo={data.aiInfo}
          setAiInfo={data.setAiInfo}
          showAiMenu={data.showAiMenu}
          setShowAiMenu={data.setShowAiMenu}
          teams={data.teams}
          handleUpdateStatus={data.handleUpdateStatus}
          handleAnalyze={data.handleAnalyze}
          handleSendReply={data.handleSendReply}
          handleAddLabel={data.handleAddLabel}
          handleAssignTeam={data.handleAssignTeam}
          contactConversations={data.contactConversations}
          loadingContactHistory={data.loadingContactHistory}
        />
      )}
    </div>
  );
}
