export type FollowPayload = {
  userId: number;
};

export type FollowResponse = {
  following: boolean;
  followerCount: number;
  followingCount: number;
};
