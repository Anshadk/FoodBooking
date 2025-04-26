import * as React from 'react';
import type { IMenuDisplayProps } from './IMenuDisplayProps';
import { Stack } from '@fluentui/react/lib/Stack';
import MenuListDisplay from './MenuListDisplay';

export default class MenuDisplay extends React.Component<IMenuDisplayProps> {
  public render(): React.ReactElement<IMenuDisplayProps> {
    const { email, displayName } = this.props.context.pageContext.user;

    return (
      <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { height: '100%' } }}>
        <MenuListDisplay 
          listName='MenuList' 
          bookingListName='BookingList' 
          currentUser={{ email, displayName }} 
        />
      </Stack>
    );
  }
}
