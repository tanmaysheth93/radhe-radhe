export interface Announcement {
  id: string;
  companyName: string;
  companyCode: string;
  announcementType: string;
  subject: string;
  submissionDate: string;
  pdfUrl: string;
  summary?: string;
  isProcessed: boolean;
}

export interface AnnouncementFilter {
  searchTerm: string;
  companyName?: string;
  announcementType?: string;
  fromDate?: string;
  toDate?: string;
}