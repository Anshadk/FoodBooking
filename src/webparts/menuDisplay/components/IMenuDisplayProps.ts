import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IMenuDisplayProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext; // ✅ Add this line to access SPFx context
}
