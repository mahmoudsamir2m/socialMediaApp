import { GenderEnum, RoleEnum, ProviderEnum } from "../enums";

export interface IUser {
  username: string;
  firstName: string;
  lastName: string;
  password?: string;
  email: string;
  phone: string;
  profilePic?: string;
  profilePicPublicId?: string;
  profileCoverPic?: string[];
  profileCoverPicPublicIds?: string[];
  gender: GenderEnum;
  role?: RoleEnum;
  provider?: ProviderEnum;
  confirmEmail: boolean;
  tokenVersion?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
