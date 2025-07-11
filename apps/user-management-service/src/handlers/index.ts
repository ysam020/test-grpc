import { UserServiceHandlers } from '@atc/proto';
import { updateUser } from './updateUser';
import { getSingleUser } from './getSingleUser';
import { deleteUser } from './deleteUser';
import { getUsers } from './getUsers';
import { changePassword } from './changePassword';
import { addToBasket } from './addToBasket';
import { removeFromBasket } from './removeFromBasket';
import { clearBasket } from './clearBasket';
import { viewBasket } from './viewBasket';
import { acceptDeviceToken } from './acceptDeviceToken';
import { getSingleUserAdmin } from './getSingleUserAdmin';
import { getUserEngagement } from './getUserEngagement';
import { getMonthlyActiveUsersCount } from './getMonthlyActiveUsersCount';

export const handlers: UserServiceHandlers = {
    GetSingleUser: getSingleUser,
    DeleteUser: deleteUser,
    GetUsers: getUsers,
    UpdateUser: updateUser,
    ChangePassword: changePassword,
    AddToBasket: addToBasket,
    RemoveFromBasket: removeFromBasket,
    ClearBasket: clearBasket,
    ViewBasket: viewBasket,
    AcceptDeviceToken: acceptDeviceToken,
    GetSingleUserAmin: getSingleUserAdmin,
    GetUserEngagement: getUserEngagement,
    GetMonthlyActiveUsersCount: getMonthlyActiveUsersCount,
};
