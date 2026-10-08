import { createFileRoute } from '@tanstack/react-router';

import { staticPageRouteOptions } from './-static-page';

export const Route = createFileRoute('/(pages)/what-is-hotel-lobby-ai')(
  staticPageRouteOptions('what-is-hotel-lobby-ai')
);
