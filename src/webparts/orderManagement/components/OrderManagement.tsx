import * as React from 'react';
import type { IOrderManagementProps } from './IOrderManagementProps';
import { Stack } from '@fluentui/react/lib/Stack';
import OrderList from './OrderList';

export default class OrderManagement extends React.Component<IOrderManagementProps> {
  public render(): React.ReactElement<IOrderManagementProps> {
    // const {
    //   description,
    //   isDarkTheme,
    //   environmentMessage,
    //   hasTeamsContext,
    //   userDisplayName
    // } = this.props;
    const { email, displayName } = this.props.context.pageContext.user;

    return (
      <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { height: '100%' } }}>
          <OrderList  bookingListName='BookingList' currentUser={{ email, displayName }} />
      </Stack>

      // <>
      // <OrderList  bookingListName='BookingList' currentUser={{ email, displayName }} />
      // </>
    );
  }
}
