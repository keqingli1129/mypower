// ---------------- Type Definitions which can be imported from ./RuntimeTypes -------------------------
export interface TableRegistrations extends BaseTableRegistrations {
    "kli_gamenight": kli_gamenight,
    "kli_gameresult": kli_gameresult,
    "kli_rsvp": kli_rsvp,
}
export interface EnumRegistrations extends BaseEnumRegistrations {
    "kli_gamenight-statecode": kli_gamenight_statecode,
    "kli_gamenight-statuscode": kli_gamenight_statuscode,
    "kli_gameresult-kli_funrating": kli_gameresult_kli_funrating,
    "kli_gameresult-statecode": kli_gameresult_statecode,
    "kli_gameresult-statuscode": kli_gameresult_statuscode,
    "kli_rsvp-kli_response": kli_rsvp_kli_response,
    "kli_rsvp-statecode": kli_rsvp_statecode,
    "kli_rsvp-statuscode": kli_rsvp_statuscode,
}
export type kli_gamenight = TableRow<{
    // Primary Key Column
    readonly kli_gamenightid: string,
    readonly createdbyname: string,
    readonly createdbyyominame: string,
    readonly createdonbehalfbyname: string,
    readonly createdonbehalfbyyominame: string,
    kli_location: string,
    kli_name: string,
    kli_startson: Date,
    readonly modifiedbyname: string,
    readonly modifiedbyyominame: string,
    readonly modifiedonbehalfbyname: string,
    readonly modifiedonbehalfbyyominame: string,
    readonly owningbusinessunitname: string,
    statecode: kli_gamenight_statecode,
    statuscode: kli_gamenight_statuscode,
}>

export type kli_gameresult = TableRow<{
    // Primary Key Column
    readonly kli_gameresultid: string,
    readonly createdbyname: string,
    readonly createdbyyominame: string,
    readonly createdonbehalfbyname: string,
    readonly createdonbehalfbyyominame: string,
    // Foreign Key Column
    readonly _kli_boardgameid_value: `/kli_boardgame(${string})`,
    readonly kli_boardgameidname: string,
    kli_funrating: kli_gameresult_kli_funrating,
    // Foreign Key Column
    _kli_gamenightid_value: `/kli_gamenight(${string})`,
    readonly kli_gamenightidname: string,
    kli_name: string,
    kli_note: string,
    // Foreign Key Column
    readonly _kli_winnerid_value: `/kli_player(${string})`,
    readonly kli_winneridname: string,
    readonly modifiedbyname: string,
    readonly modifiedbyyominame: string,
    readonly modifiedonbehalfbyname: string,
    readonly modifiedonbehalfbyyominame: string,
    readonly owningbusinessunitname: string,
    statecode: kli_gameresult_statecode,
    statuscode: kli_gameresult_statuscode,
}>

export type kli_rsvp = TableRow<{
    // Primary Key Column
    readonly kli_rsvpid: string,
    readonly createdbyname: string,
    readonly createdbyyominame: string,
    readonly createdonbehalfbyname: string,
    readonly createdonbehalfbyyominame: string,
    // Foreign Key Column
    _kli_gamenightid_value: `/kli_gamenight(${string})`,
    readonly kli_gamenightidname: string,
    kli_name: string,
    // Foreign Key Column
    readonly _kli_playerid_value: `/kli_player(${string})`,
    readonly kli_playeridname: string,
    kli_response: kli_rsvp_kli_response,
    readonly modifiedbyname: string,
    readonly modifiedbyyominame: string,
    readonly modifiedonbehalfbyname: string,
    readonly modifiedonbehalfbyyominame: string,
    readonly owningbusinessunitname: string,
    statecode: kli_rsvp_statecode,
    statuscode: kli_rsvp_statuscode,
}>

const enum kli_gamenight_statecode {
"Active" = 0,
"Inactive" = 1,
}
const enum kli_gamenight_statuscode {
"Active" = 1,
"Inactive" = 2,
"Scheduled" = 100000000,
"Played" = 100000001,
"Cancelled" = 100000002,
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
const enum kli_rsvp_kli_response {
"Going" = 100000000,
"Maybe" = 100000001,
"Not Going" = 100000002,
}
const enum kli_rsvp_statecode {
"Active" = 0,
"Inactive" = 1,
}
const enum kli_rsvp_statuscode {
"Active" = 1,
"Inactive" = 2,
}

export interface UxAgentDataApi extends BaseUxAgentDataApi<TableRegistrations, EnumRegistrations> {}

export interface GeneratedComponentProps {
    dataApi: UxAgentDataApi;
}

