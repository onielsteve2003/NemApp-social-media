'use client';

import { ProfileScreen } from '@/features/profile/components/ProfileScreen';

export default function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  return <ProfileScreen username={params.username} />;
}
