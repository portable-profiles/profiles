import { IFriend, IVisibility, VisibilityMode } from '../models';

export function forFriends(friends: IFriend[]): IVisibility {
  return {
    mode: VisibilityMode.Friends,
    friends,
  };
}
