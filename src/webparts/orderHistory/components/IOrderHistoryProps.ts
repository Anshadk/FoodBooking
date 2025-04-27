import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IOrderHistoryProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  bookingList:string;
  context: WebPartContext;
  currentUser: {
    email: string;
    displayName: string;
}
}
