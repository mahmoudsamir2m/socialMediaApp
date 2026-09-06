"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderEnum = exports.RoleEnum = exports.GenderEnum = void 0;
var GenderEnum;
(function (GenderEnum) {
    GenderEnum[GenderEnum["Male"] = 0] = "Male";
    GenderEnum[GenderEnum["Female"] = 1] = "Female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum[RoleEnum["Admin"] = 0] = "Admin";
    RoleEnum[RoleEnum["User"] = 1] = "User";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var ProviderEnum;
(function (ProviderEnum) {
    ProviderEnum[ProviderEnum["System"] = 0] = "System";
    ProviderEnum[ProviderEnum["Google"] = 1] = "Google";
})(ProviderEnum || (exports.ProviderEnum = ProviderEnum = {}));
