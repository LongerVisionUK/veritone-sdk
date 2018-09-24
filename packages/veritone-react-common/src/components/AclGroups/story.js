import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { generateOrganizations } from './test-helpers';

import AclGroups from './';

storiesOf('Acl Groups', module)
  .add('Base', () => (
    <AclGroups
      organizations={generateOrganizations(21, 2, 'viewer')}
      defaultPermission={'viewer'}
      onAclsChange={action('onAclsChange')}
      description={
        'Grant organizations permission to this program and its contents. Sharing programs will also share related Sources.'
      }
    />
  ))
  .add('No Initial ACLs', () => (
    <AclGroups
      organizations={generateOrganizations(21)}
      defaultPermission={'viewer'}
      onAclsChange={action('onAclsChange')}
      description={
        'Grant organizations permission to this program and its contents. Sharing programs will also share related Sources.'
      }
    />
  ));