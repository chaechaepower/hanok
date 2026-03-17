export type FollowPayload = {
  targetSellerId: number;
};

export type FollowResponse = {
  following: boolean;
  followerCount: number;
  followingCount: number;
};
