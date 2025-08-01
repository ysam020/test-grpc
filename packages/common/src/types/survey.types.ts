enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    BOTH = 'BOTH',
}

enum Location {
    METRO = 'METRO',
    URBAN = 'URBAN',
    RURAL = 'RURAL',
    ALL = 'ALL',
}

enum State {
    ACT = 'ACT',
    NSW = 'NSW',
    NT = 'NT',
    QLD = 'QLD',
    TAS = 'TAS',
    VIC = 'VIC',
    WA = 'WA',
    ALL = 'ALL',
    SA = 'SA',
}

enum Age {
    CHILD = 'CHILD', // <18
    YOUNG_ADULT = 'YOUNG_ADULT', // 18-20
    ADULT = 'ADULT', // 21-30
    MIDDLE_AGED = 'MIDDLE_AGED', //31-40
    SENIOR_ADULT = 'SENIOR_ADULT', //41-50
    OLDER_ADULT = 'OLDER_ADULT', //51-60
    SENIOR = 'SENIOR', // > 60
    ALL = 'ALL',
}

enum SurveyType {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    WIDGET = 'widget',
}

enum SurveyStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    INACTIVE = 'INACTIVE',
}

enum SelectionOptionEnum {
    YES = 'YES',
    NO = 'NO',
    BOTH = 'BOTH',
}

export {
    Gender,
    Location,
    Age,
    State,
    SurveyType,
    SurveyStatus,
    SelectionOptionEnum,
};
