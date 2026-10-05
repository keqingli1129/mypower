import { useEffect, useMemo, useState } from 'react';
import type { GeneratedComponentProps } from './RuntimeTypes';
import {
    makeStyles,
    mergeClasses,
    tokens,
    Text,
    Spinner,
    Button,
    Badge,
    Card,
    SearchBox,
    Select,
    Label,
    webLightTheme,
    webDarkTheme,
} from '@fluentui/react-components';
import {
    ArrowClockwiseRegular,
    CalendarRegular,
    LocationRegular,
    ClockRegular,
    CheckmarkCircleRegular,
    QuestionCircleRegular,
    TrophyRegular,
    StarFilled,
    StarRegular,
    PeopleRegular,
    GamesRegular,
    ErrorCircleRegular,
} from '@fluentui/react-icons';

// ---------- Types ----------

type HomeProps = GeneratedComponentProps & {
    pageInput?: { entityName?: string; recordId?: string; data?: Record<string, unknown> };
};

type DataApi = GeneratedComponentProps['dataApi'];

type NightRow = {
    kli_gamenightid: string;
    kli_name?: string;
    kli_location?: string;
    kli_startson?: unknown;
    statuscode?: number;
    [key: string]: unknown;
};

type RsvpRow = {
    kli_rsvpid: string;
    _kli_gamenightid_value?: string;
    kli_response?: number;
    [key: string]: unknown;
};

type ResultRow = {
    kli_gameresultid: string;
    kli_name?: string;
    kli_note?: string;
    kli_funrating?: number;
    _kli_boardgameid_value?: string;
    _kli_gamenightid_value?: string;
    _kli_winnerid_value?: string;
    [key: string]: unknown;
};

type HomeData = {
    nights: NightRow[];
    rsvps: RsvpRow[];
    results: ResultRow[];
};

type PagedResult = {
    rows: unknown[];
    hasMoreRows?: boolean;
    loadMoreRows?: () => Promise<PagedResult>;
};

type Night = {
    id: string;
    name: string;
    location: string;
    startsOn: Date | null;
    statusLabel: string;
    statusCode: number | undefined;
    going: number;
    maybe: number;
    notGoing: number;
};

type ResultItem = {
    id: string;
    game: string;
    winner: string;
    nightName: string;
    nightDate: Date | null;
    funRating: number;
    funLabel: string;
    note: string;
};

type SortKey = 'newest' | 'oldest' | 'funHigh' | 'funLow' | 'game';

// ---------- Constants ----------

const ACCENT = '#6b3fa0';
const FORMATTED = '@OData.Community.Display.V1.FormattedValue';

// kli_gamenight statuscode values
const NIGHT_STATUS_INACTIVE = 2;
const NIGHT_STATUS_PLAYED = 100000001;
const NIGHT_STATUS_CANCELLED = 100000002;

// kli_rsvp kli_response values
const RSVP_GOING = 100000000;
const RSVP_MAYBE = 100000001;
const RSVP_NOT_GOING = 100000002;

// kli_gameresult kli_funrating values
const FUN_RATING_BASE = 100000000;
const FUN_RATING_LABELS: Record<number, string> = {
    100000000: '1 - Meh',
    100000001: '2 - Okay',
    100000002: '3 - Good',
    100000003: '4 - Great',
    100000004: '5 - Brilliant',
};

// A night is still shown as "happening now" for this long after its start time.
const IN_PROGRESS_WINDOW_MS = 4 * 60 * 60 * 1000;
const UPCOMING_LIMIT = 5;
const RESULTS_PAGE_SIZE = 8;

// Window-scoped cache + in-flight de-dupe (survives host double-mount and module re-eval).
const CACHE_KEY = '__ppGameNightHome_dataCache';
const INFLIGHT_KEY = '__ppGameNightHome_dataInflight';
const winAny = window as unknown as Record<string, unknown>;

// ---------- Utilities ----------

function themeToVars(theme: Record<string, string | number>): React.CSSProperties {
    const vars: Record<string, string> = {};
    Object.entries(theme).forEach(([k, v]) => {
        vars[`--${k}`] = String(v);
    });
    return vars as React.CSSProperties;
}

function buildTheme(isDark: boolean): Record<string, string | number> {
    const base = (isDark ? webDarkTheme : webLightTheme) as unknown as Record<string, string | number>;
    const accent = isDark
        ? {
              colorBrandBackground: '#7d4fb5',
              colorBrandBackgroundHover: '#8b5fc2',
              colorBrandBackgroundPressed: '#6b3fa0',
              colorBrandForeground1: '#c9adef',
              colorBrandForeground2: '#d8c3f4',
              colorBrandStroke1: '#b794e0',
              colorCompoundBrandStroke: '#b794e0',
              colorCompoundBrandStrokeHover: '#c9adef',
              colorCompoundBrandBackground: '#b794e0',
              colorCompoundBrandBackgroundHover: '#c9adef',
          }
        : {
              colorBrandBackground: ACCENT,
              colorBrandBackgroundHover: '#5c3589',
              colorBrandBackgroundPressed: '#4a2a6f',
              colorBrandForeground1: ACCENT,
              colorBrandForeground2: '#5c3589',
              colorBrandStroke1: ACCENT,
              colorCompoundBrandStroke: ACCENT,
              colorCompoundBrandStrokeHover: '#5c3589',
              colorCompoundBrandBackground: ACCENT,
              colorCompoundBrandBackgroundHover: '#5c3589',
          };
    return { ...base, ...accent };
}

function prefersDark(): boolean {
    try {
        return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
        return false;
    }
}

function normalizeId(value: unknown): string {
    if (typeof value !== 'string') return '';
    const match = value.match(/\(([^)]+)\)/);
    const raw = match ? match[1] : value;
    return raw.replace(/[{}]/g, '').toLowerCase();
}

function toDate(value: unknown): Date | null {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
}

function formatted(row: Record<string, unknown>, field: string): string {
    const v = row[`${field}${FORMATTED}`];
    return typeof v === 'string' ? v : '';
}

function formatDateTime(d: Date | null): string {
    if (!d) return 'Date to be decided';
    return d.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatDate(d: Date | null): string {
    if (!d) return 'Unknown date';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCountdown(start: Date | null, now: number): { days: number; hours: number; minutes: number; started: boolean } {
    if (!start) return { days: 0, hours: 0, minutes: 0, started: false };
    const diff = start.getTime() - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, started: true };
    const totalMinutes = Math.floor(diff / 60000);
    return {
        days: Math.floor(totalMinutes / (60 * 24)),
        hours: Math.floor((totalMinutes % (60 * 24)) / 60),
        minutes: totalMinutes % 60,
        started: false,
    };
}

function describeCountdown(start: Date | null, now: number): string {
    if (!start) return 'Date to be decided';
    const c = getCountdown(start, now);
    if (c.started) return 'Happening now';
    if (c.days > 0) return `In ${c.days} day${c.days === 1 ? '' : 's'}`;
    if (c.hours > 0) return `In ${c.hours} hour${c.hours === 1 ? '' : 's'}`;
    return `In ${c.minutes} minute${c.minutes === 1 ? '' : 's'}`;
}

function funStars(rating: number): number {
    if (!rating) return 0;
    const stars = rating - FUN_RATING_BASE + 1;
    return stars >= 1 && stars <= 5 ? stars : 0;
}

async function collectRows(first: PagedResult, cap: number): Promise<unknown[]> {
    const all: unknown[] = [...first.rows];
    let page = first;
    while (page.hasMoreRows && page.loadMoreRows && all.length < cap) {
        page = await page.loadMoreRows();
        all.push(...page.rows);
    }
    return all;
}

async function fetchHomeData(dataApi: DataApi): Promise<HomeData> {
    const [nightsResult, rsvpsResult, resultsResult] = await Promise.all([
        dataApi.queryTable('kli_gamenight', {
            select: ['kli_gamenightid', 'kli_name', 'kli_location', 'kli_startson', 'statuscode'],
            filter: 'statecode eq 0',
            orderBy: 'kli_startson asc',
            pageSize: 250,
        }),
        dataApi.queryTable('kli_rsvp', {
            select: ['kli_rsvpid', '_kli_gamenightid_value', 'kli_response'],
            filter: 'statecode eq 0',
            pageSize: 500,
        }),
        dataApi.queryTable('kli_gameresult', {
            select: [
                'kli_gameresultid',
                'kli_name',
                'kli_note',
                'kli_funrating',
                '_kli_boardgameid_value',
                '_kli_gamenightid_value',
                '_kli_winnerid_value',
            ],
            filter: 'statecode eq 0',
            pageSize: 500,
        }),
    ]);
    const [nights, rsvps, results] = await Promise.all([
        collectRows(nightsResult as unknown as PagedResult, 1000),
        collectRows(rsvpsResult as unknown as PagedResult, 5000),
        collectRows(resultsResult as unknown as PagedResult, 2000),
    ]);
    return {
        nights: nights as NightRow[],
        rsvps: rsvps as RsvpRow[],
        results: results as ResultRow[],
    };
}

function buildNights(data: HomeData): Night[] {
    const counts = new Map<string, { going: number; maybe: number; notGoing: number }>();
    data.rsvps.forEach((r) => {
        const nightId = normalizeId(r._kli_gamenightid_value);
        if (!nightId) return;
        const entry = counts.get(nightId) ?? { going: 0, maybe: 0, notGoing: 0 };
        if (r.kli_response === RSVP_GOING) entry.going += 1;
        else if (r.kli_response === RSVP_MAYBE) entry.maybe += 1;
        else if (r.kli_response === RSVP_NOT_GOING) entry.notGoing += 1;
        counts.set(nightId, entry);
    });
    return data.nights.map((n) => {
        const id = normalizeId(n.kli_gamenightid);
        const c = counts.get(id) ?? { going: 0, maybe: 0, notGoing: 0 };
        return {
            id,
            name: n.kli_name || 'Untitled game night',
            location: n.kli_location || 'Location to be decided',
            startsOn: toDate(n.kli_startson),
            statusLabel: formatted(n, 'statuscode'),
            statusCode: n.statuscode,
            going: c.going,
            maybe: c.maybe,
            notGoing: c.notGoing,
        };
    });
}

function buildResults(data: HomeData, nights: Night[]): ResultItem[] {
    const nightById = new Map<string, Night>();
    nights.forEach((n) => nightById.set(n.id, n));
    return data.results.map((r) => {
        const nightId = normalizeId(r._kli_gamenightid_value);
        const night = nightById.get(nightId);
        const rating = typeof r.kli_funrating === 'number' ? r.kli_funrating : 0;
        return {
            id: r.kli_gameresultid,
            game: formatted(r, '_kli_boardgameid_value') || r.kli_name || 'Unknown game',
            winner: formatted(r, '_kli_winnerid_value') || 'No winner recorded',
            nightName: formatted(r, '_kli_gamenightid_value') || night?.name || 'Unknown game night',
            nightDate: night?.startsOn ?? null,
            funRating: rating,
            funLabel: formatted(r, 'kli_funrating') || FUN_RATING_LABELS[rating] || 'Not rated',
            note: r.kli_note ?? '',
        };
    });
}

function compareResults(a: ResultItem, b: ResultItem, sort: SortKey): number {
    const aTime = a.nightDate ? a.nightDate.getTime() : 0;
    const bTime = b.nightDate ? b.nightDate.getTime() : 0;
    switch (sort) {
        case 'oldest':
            return aTime - bTime;
        case 'funHigh':
            return b.funRating - a.funRating || bTime - aTime;
        case 'funLow':
            return a.funRating - b.funRating || bTime - aTime;
        case 'game':
            return a.game.localeCompare(b.game);
        case 'newest':
        default:
            return bTime - aTime;
    }
}

// ---------- Styles ----------

const useStyles = makeStyles({
    themeShell: {
        height: '100%',
        overflow: 'hidden',
    },
    root: {
        position: 'relative',
        contain: 'layout',
        height: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXL,
        padding: tokens.spacingHorizontalXL,
        backgroundColor: tokens.colorNeutralBackground2,
        color: tokens.colorNeutralForeground1,
        fontFamily: tokens.fontFamilyBase,
        '@media (max-width: 480px)': {
            padding: tokens.spacingHorizontalM,
            gap: tokens.spacingVerticalL,
        },
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalM,
    },
    headerTitle: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXXS,
    },
    subtle: {
        color: tokens.colorNeutralForeground3,
    },
    hero: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: tokens.spacingHorizontalXL,
        padding: tokens.spacingHorizontalXXL,
        borderRadius: tokens.borderRadiusMedium,
        backgroundImage: `linear-gradient(135deg, ${ACCENT} 0%, #3f2266 100%)`,
        color: '#ffffff',
        boxShadow: tokens.shadow8,
        '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
            padding: tokens.spacingHorizontalL,
        },
    },
    heroMain: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
        minWidth: 0,
    },
    heroEyebrow: {
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        color: '#e9ddf7',
    },
    heroTitle: {
        fontSize: tokens.fontSizeHero800,
        lineHeight: tokens.lineHeightHero800,
        fontWeight: tokens.fontWeightBold,
        margin: 0,
        overflowWrap: 'anywhere',
        '@media (max-width: 480px)': {
            fontSize: tokens.fontSizeBase600,
            lineHeight: tokens.lineHeightBase600,
        },
    },
    heroMeta: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalL,
        fontSize: tokens.fontSizeBase400,
    },
    heroMetaItem: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        minWidth: 0,
        overflowWrap: 'anywhere',
    },
    heroCounts: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalM,
        marginTop: tokens.spacingVerticalS,
    },
    heroCount: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: 'rgba(255, 255, 255, 0.16)',
        fontSize: tokens.fontSizeBase300,
    },
    heroCountNumber: {
        fontSize: tokens.fontSizeBase500,
        fontWeight: tokens.fontWeightBold,
        fontVariantNumeric: 'tabular-nums',
    },
    countdown: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: tokens.spacingVerticalS,
        padding: tokens.spacingHorizontalL,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: 'rgba(0, 0, 0, 0.22)',
    },
    countdownLabel: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        fontSize: tokens.fontSizeBase300,
        color: '#e9ddf7',
    },
    countdownTiles: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: tokens.spacingHorizontalS,
    },
    countdownTile: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: tokens.spacingVerticalS,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
    },
    countdownValue: {
        fontSize: tokens.fontSizeHero700,
        lineHeight: tokens.lineHeightHero700,
        fontWeight: tokens.fontWeightBold,
        fontVariantNumeric: 'tabular-nums',
    },
    countdownUnit: {
        fontSize: tokens.fontSizeBase200,
        color: '#e9ddf7',
    },
    countdownNow: {
        fontSize: tokens.fontSizeHero700,
        lineHeight: tokens.lineHeightHero700,
        fontWeight: tokens.fontWeightBold,
    },
    heroEmpty: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
    },
    columns: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
        gap: tokens.spacingHorizontalXL,
        alignItems: 'start',
        '@media (max-width: 1024px)': {
            gridTemplateColumns: '1fr',
        },
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
        padding: tokens.spacingHorizontalL,
        borderRadius: tokens.borderRadiusMedium,
        minWidth: 0,
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        margin: 0,
    },
    sectionIcon: {
        color: tokens.colorBrandForeground1,
        fontSize: tokens.fontSizeBase500,
    },
    list: {
        listStyleType: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
    },
    nightItem: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
        padding: tokens.spacingHorizontalM,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        borderTopWidth: tokens.strokeWidthThin,
        borderRightWidth: tokens.strokeWidthThin,
        borderBottomWidth: tokens.strokeWidthThin,
        borderLeftWidth: tokens.strokeWidthThin,
        borderTopStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderLeftStyle: 'solid',
        borderTopColor: tokens.colorNeutralStroke2,
        borderRightColor: tokens.colorNeutralStroke2,
        borderBottomColor: tokens.colorNeutralStroke2,
        borderLeftColor: tokens.colorNeutralStroke2,
    },
    dateBadge: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: '3.5rem',
        paddingTop: tokens.spacingVerticalXS,
        paddingBottom: tokens.spacingVerticalXS,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorBrandBackground,
        color: tokens.colorNeutralForegroundOnBrand,
    },
    dateBadgeMonth: {
        fontSize: tokens.fontSizeBase100,
        textTransform: 'uppercase',
        fontWeight: tokens.fontWeightSemibold,
    },
    dateBadgeDay: {
        fontSize: tokens.fontSizeBase500,
        fontWeight: tokens.fontWeightBold,
        lineHeight: tokens.lineHeightBase500,
        fontVariantNumeric: 'tabular-nums',
    },
    itemBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXXS,
        minWidth: 0,
        flexGrow: 1,
    },
    ellipsis: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    metaRow: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase200,
    },
    inlineIcon: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXXS,
    },
    badges: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalXS,
        flexShrink: 0,
    },
    toolbar: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: tokens.spacingHorizontalM,
    },
    toolbarField: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXXS,
        minWidth: '9rem',
    },
    searchField: {
        flexGrow: 1,
        minWidth: '12rem',
    },
    resultItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: tokens.spacingHorizontalM,
        padding: tokens.spacingHorizontalM,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        borderTopWidth: tokens.strokeWidthThin,
        borderRightWidth: tokens.strokeWidthThin,
        borderBottomWidth: tokens.strokeWidthThin,
        borderLeftWidth: tokens.strokeWidthThin,
        borderTopStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderLeftStyle: 'solid',
        borderTopColor: tokens.colorNeutralStroke2,
        borderRightColor: tokens.colorNeutralStroke2,
        borderBottomColor: tokens.colorNeutralStroke2,
        borderLeftColor: tokens.colorNeutralStroke2,
        '@media (max-width: 480px)': {
            flexDirection: 'column',
        },
    },
    trophy: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: tokens.borderRadiusCircular,
        backgroundColor: tokens.colorPaletteYellowBackground2,
        color: tokens.colorPaletteMarigoldForeground2,
        fontSize: tokens.fontSizeBase500,
    },
    winnerLine: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground2,
    },
    stars: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        flexShrink: 0,
    },
    starOn: {
        color: tokens.colorPaletteMarigoldForeground1,
        fontSize: tokens.fontSizeBase400,
    },
    starOff: {
        color: tokens.colorNeutralForeground4,
        fontSize: tokens.fontSizeBase400,
    },
    ratingWrap: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: tokens.spacingVerticalXXS,
        flexShrink: 0,
        '@media (max-width: 480px)': {
            alignItems: 'flex-start',
        },
    },
    note: {
        color: tokens.colorNeutralForeground2,
        fontStyle: 'italic',
        overflowWrap: 'anywhere',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: tokens.spacingVerticalS,
        padding: tokens.spacingVerticalXL,
        color: tokens.colorNeutralForeground3,
        textAlign: 'center',
    },
    centered: {
        display: 'flex',
        justifyContent: 'center',
        padding: tokens.spacingVerticalXXXL,
    },
    errorBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        padding: tokens.spacingHorizontalM,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorStatusDangerBackground1,
        color: tokens.colorStatusDangerForeground1,
    },
    showMore: {
        alignSelf: 'center',
    },
});

// ---------- Sub-components ----------

function FunRating(props: { rating: number; label: string }) {
    const styles = useStyles();
    const stars = funStars(props.rating);
    return (
        <span className={styles.stars} role="img" aria-label={stars ? `Fun rating: ${props.label}` : 'Not rated'}>
            {[1, 2, 3, 4, 5].map((i) =>
                i <= stars ? (
                    <StarFilled key={i} className={styles.starOn} aria-hidden="true" />
                ) : (
                    <StarRegular key={i} className={styles.starOff} aria-hidden="true" />
                ),
            )}
        </span>
    );
}

function Countdown(props: { start: Date | null; now: number }) {
    const styles = useStyles();
    const c = getCountdown(props.start, props.now);
    const label = describeCountdown(props.start, props.now);
    return (
        <div className={styles.countdown} role="timer" aria-label={`Countdown: ${label}`}>
            <span className={styles.countdownLabel}>
                <ClockRegular aria-hidden="true" />
                {c.started ? 'Status' : 'Starts in'}
            </span>
            {c.started || !props.start ? (
                <span className={styles.countdownNow}>{props.start ? 'Happening now' : 'Time to be decided'}</span>
            ) : (
                <div className={styles.countdownTiles} aria-hidden="true">
                    <div className={styles.countdownTile}>
                        <span className={styles.countdownValue}>{c.days}</span>
                        <span className={styles.countdownUnit}>{c.days === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className={styles.countdownTile}>
                        <span className={styles.countdownValue}>{c.hours}</span>
                        <span className={styles.countdownUnit}>{c.hours === 1 ? 'hour' : 'hours'}</span>
                    </div>
                    <div className={styles.countdownTile}>
                        <span className={styles.countdownValue}>{c.minutes}</span>
                        <span className={styles.countdownUnit}>{c.minutes === 1 ? 'min' : 'mins'}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function HeroCard(props: { night: Night | undefined; now: number }) {
    const styles = useStyles();
    const { night, now } = props;
    if (!night) {
        return (
            <section className={styles.hero} aria-labelledby="next-night-title">
                <div className={styles.heroEmpty}>
                    <span className={styles.heroEyebrow}>Next game night</span>
                    <h2 id="next-night-title" className={styles.heroTitle}>
                        No game night scheduled
                    </h2>
                    <span>Schedule the next game night to see the countdown and RSVPs here.</span>
                </div>
            </section>
        );
    }
    return (
        <section className={styles.hero} aria-labelledby="next-night-title">
            <div className={styles.heroMain}>
                <span className={styles.heroEyebrow}>Next game night</span>
                <h2 id="next-night-title" className={styles.heroTitle}>
                    {night.name}
                </h2>
                <div className={styles.heroMeta}>
                    <span className={styles.heroMetaItem}>
                        <CalendarRegular aria-hidden="true" />
                        {formatDateTime(night.startsOn)}
                    </span>
                    <span className={styles.heroMetaItem}>
                        <LocationRegular aria-hidden="true" />
                        {night.location}
                    </span>
                </div>
                <div className={styles.heroCounts} aria-label="RSVP summary">
                    <span className={styles.heroCount}>
                        <CheckmarkCircleRegular aria-hidden="true" />
                        <span className={styles.heroCountNumber}>{night.going}</span>
                        going
                    </span>
                    <span className={styles.heroCount}>
                        <QuestionCircleRegular aria-hidden="true" />
                        <span className={styles.heroCountNumber}>{night.maybe}</span>
                        maybe
                    </span>
                </div>
            </div>
            <Countdown start={night.startsOn} now={now} />
        </section>
    );
}

function UpcomingItem(props: { night: Night; now: number }) {
    const styles = useStyles();
    const { night, now } = props;
    const month = night.startsOn ? night.startsOn.toLocaleDateString(undefined, { month: 'short' }) : 'TBD';
    const day = night.startsOn ? String(night.startsOn.getDate()) : '–';
    return (
        <li className={styles.nightItem}>
            <div className={styles.dateBadge} aria-hidden="true">
                <span className={styles.dateBadgeMonth}>{month}</span>
                <span className={styles.dateBadgeDay}>{day}</span>
            </div>
            <div className={styles.itemBody}>
                <Text weight="semibold" className={styles.ellipsis} title={night.name}>
                    {night.name}
                </Text>
                <div className={styles.metaRow}>
                    <span className={styles.inlineIcon}>
                        <CalendarRegular aria-hidden="true" />
                        {formatDateTime(night.startsOn)}
                    </span>
                    <span className={styles.inlineIcon}>
                        <LocationRegular aria-hidden="true" />
                        {night.location}
                    </span>
                </div>
                <Text size={200} className={styles.subtle}>
                    {describeCountdown(night.startsOn, now)}
                </Text>
            </div>
            <div className={styles.badges}>
                <Badge appearance="tint" color="success" icon={<CheckmarkCircleRegular />} aria-label={`${night.going} going`}>
                    {night.going}
                </Badge>
                <Badge appearance="tint" color="warning" icon={<QuestionCircleRegular />} aria-label={`${night.maybe} maybe`}>
                    {night.maybe}
                </Badge>
            </div>
        </li>
    );
}

function ResultListItem(props: { item: ResultItem }) {
    const styles = useStyles();
    const { item } = props;
    return (
        <li className={styles.resultItem}>
            <div className={styles.trophy} aria-hidden="true">
                <TrophyRegular />
            </div>
            <div className={styles.itemBody}>
                <Text weight="semibold" size={400} className={styles.ellipsis} title={item.game}>
                    {item.game}
                </Text>
                <span className={styles.winnerLine}>
                    <TrophyRegular aria-hidden="true" />
                    Winner: {item.winner}
                </span>
                <div className={styles.metaRow}>
                    <span className={styles.inlineIcon}>
                        <PeopleRegular aria-hidden="true" />
                        {item.nightName}
                    </span>
                    <span className={styles.inlineIcon}>
                        <CalendarRegular aria-hidden="true" />
                        {formatDate(item.nightDate)}
                    </span>
                </div>
                {item.note ? <Text size={200} className={styles.note}>{item.note}</Text> : null}
            </div>
            <div className={styles.ratingWrap}>
                <FunRating rating={item.funRating} label={item.funLabel} />
                <Text size={200} className={styles.subtle}>
                    {item.funLabel}
                </Text>
            </div>
        </li>
    );
}

// ---------- Page ----------

const GeneratedComponent = (props: HomeProps) => {
    const { dataApi, pageInput } = props;
    void pageInput; // landing page takes no input
    const styles = useStyles();

    const [isDark, setIsDark] = useState<boolean>(() => prefersDark());
    const [{ data, loading, error }, setState] = useState<{ data: HomeData | null; loading: boolean; error: string | null }>(
        () => {
            const cached = winAny[CACHE_KEY] as HomeData | undefined;
            return { data: cached ?? null, loading: cached === undefined, error: null };
        },
    );
    const [reloadKey, setReloadKey] = useState(0);
    const [now, setNow] = useState<number>(() => Date.now());
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortKey>('newest');
    const [minRating, setMinRating] = useState<string>('all');
    const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE);

    const dataReady = !!dataApi;

    // Follow the system color scheme.
    useEffect(() => {
        if (typeof window.matchMedia !== 'function') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', onChange);
            return () => mq.removeEventListener('change', onChange);
        }
        mq.addListener(onChange);
        return () => mq.removeListener(onChange);
    }, []);

    // Tick the countdown once a minute.
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 60000);
        return () => window.clearInterval(timer);
    }, []);

    // Load nights, RSVPs and results with window cache + in-flight de-dupe.
    useEffect(() => {
        if (!dataReady) return;

        const cached = winAny[CACHE_KEY] as HomeData | undefined;
        if (cached !== undefined) {
            if (data !== cached) setState({ data: cached, loading: false, error: null });
            return;
        }
        let cancelled = false;

        let inflight = winAny[INFLIGHT_KEY] as Promise<HomeData> | undefined;
        if (!inflight) {
            inflight = fetchHomeData(dataApi)
                .then((result) => {
                    winAny[CACHE_KEY] = result;
                    return result;
                })
                .finally(() => {
                    if (winAny[INFLIGHT_KEY] === inflight) delete winAny[INFLIGHT_KEY];
                });
            winAny[INFLIGHT_KEY] = inflight;
        }

        inflight
            .then((result) => {
                if (!cancelled) setState({ data: result, loading: false, error: null });
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                console.error('Failed to load game night data:', err);
                setState({ data: null, loading: false, error: 'Unable to load game night data. Please try again.' });
            });

        return () => {
            cancelled = true;
        };
        // Readiness + reloadKey only — never `dataApi` (new reference every render).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataReady, reloadKey]);

    const nights = useMemo(() => (data ? buildNights(data) : []), [data]);

    const upcoming = useMemo(
        () =>
            nights
                .filter(
                    (n) =>
                        n.startsOn !== null &&
                        n.startsOn.getTime() + IN_PROGRESS_WINDOW_MS > now &&
                        n.statusCode !== NIGHT_STATUS_PLAYED &&
                        n.statusCode !== NIGHT_STATUS_CANCELLED &&
                        n.statusCode !== NIGHT_STATUS_INACTIVE,
                )
                .sort((a, b) => (a.startsOn as Date).getTime() - (b.startsOn as Date).getTime()),
        [nights, now],
    );

    const results = useMemo(() => (data ? buildResults(data, nights) : []), [data, nights]);

    const filteredResults = useMemo(() => {
        const term = search.trim().toLowerCase();
        const minStars = minRating === 'all' ? 0 : Number(minRating);
        return results
            .filter((r) => {
                if (minStars > 0 && funStars(r.funRating) < minStars) return false;
                if (!term) return true;
                return (
                    r.game.toLowerCase().includes(term) ||
                    r.winner.toLowerCase().includes(term) ||
                    r.nightName.toLowerCase().includes(term) ||
                    r.note.toLowerCase().includes(term)
                );
            })
            .sort((a, b) => compareResults(a, b, sort));
    }, [results, search, sort, minRating]);

    const theme = useMemo(() => buildTheme(isDark), [isDark]);

    const handleRefresh = () => {
        delete winAny[CACHE_KEY];
        delete winAny[INFLIGHT_KEY];
        setState({ data, loading: true, error: null });
        setReloadKey((k) => k + 1);
    };

    const nextNight = upcoming[0];
    const laterNights = upcoming.slice(1, UPCOMING_LIMIT + 1);
    const shownResults = filteredResults.slice(0, visibleCount);

    return (
        <div className={styles.themeShell} style={themeToVars(theme)}>
            <main className={styles.root} aria-labelledby="home-title">
                <header className={styles.header}>
                    <div className={styles.headerTitle}>
                        <Text as="h1" id="home-title" size={800} weight="bold">
                            Game night HQ
                        </Text>
                        <Text className={styles.subtle}>What's next, who's coming, and who won last time.</Text>
                    </div>
                    <Button
                        appearance="secondary"
                        icon={<ArrowClockwiseRegular />}
                        onClick={handleRefresh}
                        disabled={loading}
                        aria-label="Refresh game night data"
                    >
                        Refresh
                    </Button>
                </header>

                {error ? (
                    <div role="alert" className={styles.errorBanner}>
                        <ErrorCircleRegular aria-hidden="true" />
                        <Text>{error}</Text>
                    </div>
                ) : null}

                {loading ? (
                    <div className={styles.centered}>
                        <Spinner labelPosition="below" label="Loading game nights…" />
                    </div>
                ) : (
                    <>
                        <HeroCard night={nextNight} now={now} />

                        <div className={styles.columns}>
                            <Card className={styles.section} aria-labelledby="upcoming-title">
                                <h2 id="upcoming-title" className={styles.sectionHeader}>
                                    <CalendarRegular className={styles.sectionIcon} aria-hidden="true" />
                                    <Text size={500} weight="semibold">
                                        Coming up after that
                                    </Text>
                                </h2>
                                {laterNights.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <CalendarRegular aria-hidden="true" />
                                        <Text>No other game nights scheduled yet.</Text>
                                    </div>
                                ) : (
                                    <ul className={styles.list} aria-label="Upcoming game nights">
                                        {laterNights.map((n) => (
                                            <UpcomingItem key={n.id} night={n} now={now} />
                                        ))}
                                    </ul>
                                )}
                            </Card>

                            <Card className={styles.section} aria-labelledby="results-title">
                                <h2 id="results-title" className={styles.sectionHeader}>
                                    <GamesRegular className={styles.sectionIcon} aria-hidden="true" />
                                    <Text size={500} weight="semibold">
                                        Recent results
                                    </Text>
                                </h2>
                                <div className={styles.toolbar} role="search" aria-label="Filter game results">
                                    <div className={mergeClasses(styles.toolbarField, styles.searchField)}>
                                        <Label htmlFor="results-search" size="small">
                                            Search
                                        </Label>
                                        <SearchBox
                                            id="results-search"
                                            placeholder="Game, winner or game night"
                                            value={search}
                                            onChange={(_, d) => {
                                                setSearch(d.value ?? '');
                                                setVisibleCount(RESULTS_PAGE_SIZE);
                                            }}
                                        />
                                    </div>
                                    <div className={styles.toolbarField}>
                                        <Label htmlFor="results-sort" size="small">
                                            Sort by
                                        </Label>
                                        <Select
                                            id="results-sort"
                                            value={sort}
                                            onChange={(_, d) => setSort(d.value as SortKey)}
                                        >
                                            <option value="newest">Newest first</option>
                                            <option value="oldest">Oldest first</option>
                                            <option value="funHigh">Most fun first</option>
                                            <option value="funLow">Least fun first</option>
                                            <option value="game">Game name (A–Z)</option>
                                        </Select>
                                    </div>
                                    <div className={styles.toolbarField}>
                                        <Label htmlFor="results-rating" size="small">
                                            Fun rating
                                        </Label>
                                        <Select
                                            id="results-rating"
                                            value={minRating}
                                            onChange={(_, d) => {
                                                setMinRating(d.value);
                                                setVisibleCount(RESULTS_PAGE_SIZE);
                                            }}
                                        >
                                            <option value="all">Any rating</option>
                                            <option value="5">5 stars only</option>
                                            <option value="4">4 stars and up</option>
                                            <option value="3">3 stars and up</option>
                                            <option value="2">2 stars and up</option>
                                        </Select>
                                    </div>
                                </div>
                                <Text size={200} className={styles.subtle} aria-live="polite">
                                    Showing {shownResults.length} of {filteredResults.length} result
                                    {filteredResults.length === 1 ? '' : 's'}
                                </Text>
                                {filteredResults.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <TrophyRegular aria-hidden="true" />
                                        <Text>
                                            {results.length === 0
                                                ? 'No game results recorded yet.'
                                                : 'No results match your search or filter.'}
                                        </Text>
                                    </div>
                                ) : (
                                    <ul className={styles.list} aria-label="Recent game results">
                                        {shownResults.map((r) => (
                                            <ResultListItem key={r.id} item={r} />
                                        ))}
                                    </ul>
                                )}
                                {filteredResults.length > visibleCount ? (
                                    <Button
                                        className={styles.showMore}
                                        appearance="subtle"
                                        onClick={() => setVisibleCount((c) => c + RESULTS_PAGE_SIZE)}
                                    >
                                        Show more results
                                    </Button>
                                ) : null}
                            </Card>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default GeneratedComponent;
