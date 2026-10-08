import { createFileRoute } from '@tanstack/react-router';

import { staticPageRouteOptions } from './-static-page';

export const Route = createFileRoute('/(pages)/hotel-lobby-ai-prompts')(
  staticPageRouteOptions('hotel-lobby-ai-prompts')
);
