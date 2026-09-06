import { GenderEnum, RoleEnum, ProviderEnum } from "../enums";


export interface IUser {
  username: string;
  firstName: string;
  lastName: string;
  password?: string;
  email: string;
  phone: string;
  profilePic?: string;
  profileCoverPic?: string[];
  gender: GenderEnum;
  role?: RoleEnum;
  provider?: ProviderEnum;
  confirmEmail: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
