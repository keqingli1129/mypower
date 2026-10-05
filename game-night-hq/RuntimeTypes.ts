// ---------------- Type Definitions which can be imported from ./RuntimeTypes -------------------------
export interface TableRegistrations extends BaseTableRegistrations {
    "kli_boardgame": kli_boardgame,
    "kli_gameresult": kli_gameresult,
    "kli_player": kli_player,
}
export interface EnumRegistrations extends BaseEnumRegistrations {
    "kli_boardgame-kli_complexity": kli_boardgame_kli_complexity,
    "kli_boardgame-statecode": kli_boardgame_statecode,
    "kli_boardgame-statuscode": kli_boardgame_statuscode,
    "kli_gameresult-kli_funrating": kli_gameresult_kli_funrating,
    "kli_gameresult-statecode": kli_gameresult_statecode,
    "kli_gameresult-statuscode": kli_gameresult_statuscode,
    "kli_player-statecode": kli_player_statecode,
    "kli_player-statuscode": kli_player_statuscode,
}
export type kli_boardgame = TableRow<{
    // Primary Key Column
    readonly kli_boardgameid: string,
    readonly createdbyname: string,
    readonly createdbyyominame: string,
    readonly createdonbehalfbyname: string,
    readonly createdonbehalfbyyominame: string,
    kli_avgduration: number,
    kli_complexity: kli_boardgame_kli_complexity,
    kli_maxplayers: number,
    kli_minplayers: number,
    kli_name: string,
    readonly modifiedbyname: string,
    readonly modifiedbyyominame: string,
    readonly modifiedonbehalfbyname: string,
    readonly modifiedonbehalfbyyominame: string,
    readonly owningbusinessunitname: string,
    statecode: kli_boardgame_statecode,
    statuscode: kli_boardgame_statuscode,
}>

export type kli_gameresult = TableRow<{
    // Primary Key Column
    readonly kli_gameresultid: string,
    readonly createdbyname: string,
    readonly createdbyyominame: string,
    readonly createdonbehalfbyname: string,
    readonly createdonbehalfbyyominame: string,
    // Foreign Key Column
    _kli_boardgameid_value: `/kli_boardgame(${string})`,
    readonly kli_boardgameidname: string,
    kli_funrating: kli_gameresult_kli_funrating,
    // Foreign Key Column
    readonly _kli_gamenightid_value: `/kli_gamenight(${string})`,
    readonly kli_gamenightidname: string,
    kli_name: string,
    kli_note: string,
    // Foreign Key Column
    _kli_winnerid_value: `/kli_player(${string})`,
    readonly kli_winneridname: string,
    readonly modifiedbyname: string,
    readonly modifiedbyyominame: string,
    readonly modifiedonbehalfbyname: string,
    readonly modifiedonbehalfbyyominame: string,
    readonly owningbusinessunitname: string,
    statecode: kli_gameresult_statecode,
    statuscode: kli_gameresult_statuscode,
}>

export type kli_player = TableRow<{
    // Primary Key Column
    readonly kli_playerid: string,
    readonly createdbyname: string,
    readonly createdbyyominame: string,
    readonly createdonbehalfbyname: string,
    readonly createdonbehalfbyyominame: string,
    kli_email: string,
    kli_name: string,
    readonly modifiedbyname: string,
    readonly modifiedbyyominame: string,
    readonly modifiedonbehalfbyname: string,
    readonly modifiedonbehalfbyyominame: string,
    readonly owningbusinessunitname: string,
    statecode: kli_player_statecode,
    statuscode: kli_player_statuscode,
}>

const enum kli_boardgame_kli_complexity {
"Light" = 100000000,
"Medium" = 100000001,
"Heavy" = 100000002,
}
const enum kli_boardgame_statecode {
"Active" = 0,
"Inactive" = 1,
}
const enum kli_boardgame_statuscode {
"Active" = 1,
"Inactive" = 2,
}
const enum kli_gameresult_kli_funrating {
"1 - Meh" = 100000000,
"2 - Okay" = 100000001,
"3 - Good" = 100000002,
"4 - Great" = 100000003,
"5 - Brilliant" = 100000004,
}
const enum kli_gameresult_statecode {
"Active" = 0,
"Inactive" = 1,
}
const enum kli_gameresult_statuscode {
"Active" = 1,
"Inactive" = 2,
}
const enum kli_player_statecode {
"Active" = 0,
"Inactive" = 1,
}
const enum kli_player_statuscode {
"Active" = 1,
"Inactive" = 2,
}

export interface UxAgentDataApi extends BaseUxAgentDataApi<TableRegistrations, EnumRegistrations> {}

export interface GeneratedComponentProps {
    dataApi: UxAgentDataApi;
}

