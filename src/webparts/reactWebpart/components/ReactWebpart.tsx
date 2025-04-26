// import * as React from 'react';
// import { IReactWebpartProps } from './IReactWebpartProps';

// const ReactWebpart: React.FC<IReactWebpartProps> = (props) => {
//   return (
//     <div>
//       <h2>Hello, {props.userDisplayName}</h2>
//       <p>{props.environmentMessage}</p>
//       <h3>User List:</h3>
//       <ul>
//         {props.users.map(user => (
//           <li key={user.id}>
//             <strong>{user.name}</strong> — {user.email}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default ReactWebpart;


// import * as React from 'react';
// import { IReactWebpartProps } from './IReactWebpartProps';
// import { Spinner, SpinnerSize, MessageBar, MessageBarType } from '@fluentui/react';

// interface IReactWebpartState {
//   isLoading: boolean;
//   error: string | null;
// }

// export default class ReactWebpart extends React.Component<IReactWebpartProps, IReactWebpartState> {
//   constructor(props: IReactWebpartProps) {
//     super(props);

//     this.state = {
//       isLoading: this.props.users.length === 0,
//       error: null
//     };
//   }

//   componentDidUpdate(prevProps: IReactWebpartProps) {
//     if (prevProps.users !== this.props.users && this.state.isLoading) {
//       this.setState({ isLoading: false });
//     }
//   }

//   public render(): React.ReactElement<IReactWebpartProps> {
//     const {
//       userDisplayName,
//       description,
//       environmentMessage,
//       isDarkTheme,
//       users
//     } = this.props;
//     const { isLoading, error } = this.state;

//     const styles: { [key: string]: React.CSSProperties } = {
//       container: {
//         padding: '20px',
//         fontFamily: 'Segoe UI, sans-serif',
//         color: isDarkTheme ? '#fff' : '#333',
//         backgroundColor: isDarkTheme ? '#1a1a1a' : '#f3f3f3',
//         borderRadius: '8px',
//         boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
//       },
//       heading: {
//         fontSize: '1.5rem',
//         marginBottom: '10px'
//       },
//       subText: {
//         marginBottom: '20px'
//       },
//       userList: {
//         listStyleType: 'none',
//         paddingLeft: 0
//       },
//       userItem: {
//         padding: '8px 12px',
//         borderBottom: '1px solid #ccc',
//         backgroundColor: isDarkTheme ? '#333' : '#fff',
//         borderRadius: '4px',
//         marginBottom: '8px'
//       }
//     };

//     return (
//       <div style={styles.container}>
//         <div style={styles.heading}>Hello, {userDisplayName} 👋</div>
//         <div style={styles.subText}>{description}</div>
//         <div style={styles.subText}>{environmentMessage}</div>

//         {error && (
//           <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
//             {error}
//           </MessageBar>
//         )}

//         {isLoading ? (
//           <Spinner label="Loading users..." size={SpinnerSize.medium} />
//         ) : (
//           <>
//             <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>User List:</div>
//             <ul style={styles.userList}>
//               {users && users.length > 0 ? (
//                 users.map(user => (
//                   <li key={user.id} style={styles.userItem}>
//                     <strong>{user.name}</strong> — {user.email}
//                   </li>
//                 ))
//               ) : (
//                 <li>No users found.</li>
//               )}
//             </ul>
//           </>
//         )}
//       </div>
//     );
//   }
// }



import * as React from 'react';
import { IReactWebpartProps } from './IReactWebpartProps';

interface IReactWebpartState {
  // You could also manage state here, if needed
}

export default class ReactWebpart extends React.Component<IReactWebpartProps, IReactWebpartState> {
  constructor(props: IReactWebpartProps) {
    super(props);

    // Initialize state if needed
    this.state = {};
  }

  public render(): React.ReactElement<IReactWebpartProps> {
    const {
      userDisplayName,
      description,
      environmentMessage,
      isDarkTheme,
      users
    } = this.props;

    return (
      <div style={{ color: isDarkTheme ? '#fff' : '#000' }}>
        <h2>Hello, {userDisplayName}</h2>
        <p>{description}</p>
        <p>{environmentMessage}</p>

        <h3>User List:</h3>
        <ul>
          {users && users.length > 0 ? (
            users.map(user => (
              <li key={user.id}>
                <strong>{user.name}</strong> — {user.email}
              </li>
            ))
          ) : (
            <li>No users found.</li>
          )}
        </ul>
      </div>
    );
  }
}
