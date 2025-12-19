export interface DocumentForm {
  parties: string[];
  dates: {
    start?: string;
    end?: string;
  };
  city: string;
  subject: string;
  [key: string]: any;
}

export interface DocumentPreview {
  html: string;
}



