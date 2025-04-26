export interface IReactWebpartProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  users: any[]; // Ideally, define a proper interface for user data
}
