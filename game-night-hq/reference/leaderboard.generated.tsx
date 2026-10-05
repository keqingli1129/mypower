import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GeneratedComponentProps } from './RuntimeTypes';
import {
    makeStyles,
    mergeClasses,
    tokens,
    Text,
    Spinner,
    Button,
    ToggleButton,
    Switch,
    SearchBox,
    Badge,
    Card,
    DataGrid,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridBody,
    DataGridRow,
    DataGridCell,
    TableCellLayout,
    createTableColumn,
} from '@fluentui/react-components';
import type { TableColumnDefinition } from '@fluentui/react-components';
import {
    ArrowClockwiseRegular,
    TrophyRegular,
    TrophyFilled,
    PeopleRegular,
    StarFilled,
    StarRegular,
    GamesRegular,
    ErrorCircleRegular,
} from '@fluentui/react-icons';

// ---------- Types ----------

type PageInputShape = {
    entityName?: string;
    recordId?: string;
    data?: Record<string, unknown>;
};

type LeaderboardProps = GeneratedComponentProps & { pageInput?: PageInputShape };

type DataApi = GeneratedComponentProps['dataApi'];

type RawRow = Record<string, unknown>;

type PagedResult = {
    rows: RawRow[];
    hasMoreRows?: boolean;
    loadMoreRows?: () => Promise<PagedResult>;
};

type ResultItem = {
    id: string;
    gameId?: string;
    gameName: string;
    winnerId?: string;
    winnerName: string;
    fun?: number;
};

type PlayerItem = { id: string; name: string };

type GameItem = { id: string; name: string; complexity?: number; complexityLabel: string };

type Bundle = { results: ResultItem[]; players: PlayerItem[]; games: GameItem[] };

type PlayerStat = { id: string; name: string; wins: number; rank: number; share: number };

type GameStat = {
    id: string;
    name: string;
    complexity?: number;
    complexityLabel: string;
    plays: number;
    ratedCount: number;
    avgFun: number | null;
};

type ComplexityFilter = 'all' | 'light' | 'medium' | 'heavy';

// ---------- Constants ----------

const ACCENT = '#6b3fa0';
const FORMATTED = '@OData.Community.Display.V1.FormattedValue';
const FUN_BASE = 100000000;
const COMPLEXITY_LABELS: Record<number, string> = {
    100000000: 'Light',
    100000001: 'Medium',
    100000002: 'Heavy',
};
const COMPLEXITY_FILTER_VALUES: Record<Exclude<ComplexityFilter, 'all'>, number> = {
    light: 100000000,
    medium: 100000001,
    heavy: 100000002,
};
const COMPLEXITY_OPTIONS: { key: ComplexityFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'light', label: 'Light' },
    { key: 'medium', label: 'Medium' },
    { key: 'heavy', label: 'Heavy' },
];

// Window-scoped cache + in-flight de-dupe (survives host double-mount and module re-eval).
const CACHE_KEY = '__ppLeaderboard_bundleCache';
const INFLIGHT_KEY = '__ppLeaderboard_bundleInflight';
const winAny = window as unknown as Record<string, unknown>;

// ---------- Utilities ----------

function asString(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) return value;
    return undefined;
}

function lookupId(value: unknown): string | undefined {
    const raw = asString(value);
    if (!raw) return undefined;
    const match = /\(([^)]+)\)/.exec(raw);
    return (match ? match[1] : raw).toLowerCase();
}

function toFunScore(value: unknown): number | undefined {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    if (!Number.isFinite(num)) return undefined;
    const score = num - FUN_BASE + 1;
    return score >= 1 && score <= 5 ? score : undefined;
}

function toNumber(value: unknown): number | undefined {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return Number.isFinite(num) ? num : undefined;
}

async function collectRows(first: unknown): Promise<RawRow[]> {
    let page = first as PagedResult;
    const rows: RawRow[] = [...(page.rows ?? [])];
    let guard = 0;
    while (page.hasMoreRows && typeof page.loadMoreRows === 'function' && guard < 40) {
        page = await page.loadMoreRows();
        rows.push(...(page.rows ?? []));
        guard += 1;
    }
    return rows;
}

async function loadBundle(dataApi: DataApi): Promise<Bundle> {
    const [resultPage, playerPage, gamePage] = await Promise.all([
        dataApi.queryTable('kli_gameresult', {
            select: ['kli_gameresultid', 'kli_name', '_kli_boardgameid_value', '_kli_winnerid_value', 'kli_funrating'],
            filter: 'statecode eq 0',
            pageSize: 500,
        }),
        dataApi.queryTable('kli_player', {
            select: ['kli_playerid', 'kli_name'],
            filter: 'statecode eq 0',
            orderBy: 'kli_name asc',
            pageSize: 500,
        }),
        dataApi.queryTable('kli_boardgame', {
            select: ['kli_boardgameid', 'kli_name', 'kli_complexity'],
            filter: 'statecode eq 0',
            orderBy: 'kli_name asc',
            pageSize: 500,
        }),
    ]);

    const [resultRows, playerRows, gameRows] = await Promise.all([
        collectRows(resultPage),
        collectRows(playerPage),
        collectRows(gamePage),
    ]);

    const results = new Map<string, ResultItem>();
    resultRows.forEach((row) => {
        const id = asString(row.kli_gameresultid);
        if (!id) return;
        results.set(id, {
            id,
            gameId: lookupId(row._kli_boardgameid_value),
            gameName: asString(row[`_kli_boardgameid_value${FORMATTED}`]) ?? 'Unknown game',
            winnerId: lookupId(row._kli_winnerid_value),
            winnerName: asString(row[`_kli_winnerid_value${FORMATTED}`]) ?? 'Unknown player',
            fun: toFunScore(row.kli_funrating),
        });
    });

    const players = new Map<string, PlayerItem>();
    playerRows.forEach((row) => {
        const id = lookupId(row.kli_playerid);
        if (!id) return;
        players.set(id, { id, name: asString(row.kli_name) ?? 'Unnamed player' });
    });

    const games = new Map<string, GameItem>();
    gameRows.forEach((row) => {
        const id = lookupId(row.kli_boardgameid);
        if (!id) return;
        const complexity = toNumber(row.kli_complexity);
        games.set(id, {
            id,
            name: asString(row.kli_name) ?? 'Unnamed game',
            complexity,
            complexityLabel:
                asString(row[`kli_complexity${FORMATTED}`]) ??
                (complexity !== undefined ? COMPLEXITY_LABELS[complexity] ?? '—' : '—'),
        });
    });

    return {
        results: Array.from(results.values()),
        players: Array.from(players.values()),
        games: Array.from(games.values()),
    };
}

function computePlayerStats(bundle: Bundle | null): PlayerStat[] {
    if (!bundle) return [];
    const wins = new Map<string, { id: string; name: string; wins: number }>();
    bundle.players.forEach((p) => wins.set(p.id, { id: p.id, name: p.name, wins: 0 }));
    bundle.results.forEach((r) => {
        if (!r.winnerId) return;
        const existing = wins.get(r.winnerId);
        if (existing) {
            existing.wins += 1;
        } else {
            wins.set(r.winnerId, { id: r.winnerId, name: r.winnerName, wins: 1 });
        }
    });
    const sorted = Array.from(wins.values()).sort(
        (a, b) => b.wins - a.wins || a.name.localeCompare(b.name),
    );
    const maxWins = sorted.length > 0 ? sorted[0].wins : 0;
    let lastWins = -1;
    let lastRank = 0;
    return sorted.map((p, index) => {
        const rank = p.wins === lastWins ? lastRank : index + 1;
        lastWins = p.wins;
        lastRank = rank;
        return { ...p, rank, share: maxWins > 0 ? (p.wins / maxWins) * 100 : 0 };
    });
}

function computeGameStats(bundle: Bundle | null): GameStat[] {
    if (!bundle) return [];
    const stats = new Map<string, GameStat & { funTotal: number }>();
    bundle.games.forEach((g) =>
        stats.set(g.id, {
            id: g.id,
            name: g.name,
            complexity: g.complexity,
            complexityLabel: g.complexityLabel,
            plays: 0,
            ratedCount: 0,
            avgFun: null,
            funTotal: 0,
        }),
    );
    bundle.results.forEach((r) => {
        const key = r.gameId ?? `name:${r.gameName}`;
        let entry = stats.get(key);
        if (!entry) {
            entry = {
                id: key,
                name: r.gameName,
                complexity: undefined,
                complexityLabel: '—',
                plays: 0,
                ratedCount: 0,
                avgFun: null,
                funTotal: 0,
            };
            stats.set(key, entry);
        }
        entry.plays += 1;
        if (r.fun !== undefined) {
            entry.ratedCount += 1;
            entry.funTotal += r.fun;
        }
    });
    return Array.from(stats.values()).map((s) => ({
        id: s.id,
        name: s.name,
        complexity: s.complexity,
        complexityLabel: s.complexityLabel,
        plays: s.plays,
        ratedCount: s.ratedCount,
        avgFun: s.ratedCount > 0 ? s.funTotal / s.ratedCount : null,
    }));
}

function formatFun(value: number | null): string {
    return value === null ? 'Not rated' : `${value.toFixed(1)} / 5`;
}

function pluralize(count: number, singular: string, plural: string): string {
    return `${count} ${count === 1 ? singular : plural}`;
}

// ---------- Styles ----------

const useStyles = makeStyles({
    root: {
        position: 'relative',
        contain: 'layout',
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalL,
        padding: tokens.spacingHorizontalXL,
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
        color: tokens.colorNeutralForeground1,
        backgroundColor: tokens.colorNeutralBackground2,
        '@media (max-width: 480px)': {
            padding: tokens.spacingHorizontalM,
        },
    },
    header: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacingHorizontalM,
    },
    titleBlock: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
    },
    titleIcon: {
        fontSize: '32px',
        color: ACCENT,
    },
    titleText: {
        display: 'flex',
        flexDirection: 'column',
    },
    headerActions: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
    search: {
        minWidth: '220px',
        '@media (max-width: 480px)': {
            minWidth: '0',
            width: '100%',
        },
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: tokens.spacingHorizontalL,
        '@media (max-width: 1024px)': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        },
        '@media (max-width: 480px)': {
            gridTemplateColumns: '1fr',
        },
    },
    statCard: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
        padding: tokens.spacingHorizontalL,
        borderRadius: tokens.borderRadiusMedium,
    },
    statIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: '40px',
        height: '40px',
        borderRadius: tokens.borderRadiusCircular,
        backgroundColor: ACCENT,
        color: '#ffffff',
        fontSize: '20px',
    },
    statText: {
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
    },
    truncate: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: tokens.spacingHorizontalL,
        alignItems: 'start',
        '@media (max-width: 900px)': {
            gridTemplateColumns: 'minmax(0, 1fr)',
        },
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
        padding: tokens.spacingHorizontalL,
        borderRadius: tokens.borderRadiusMedium,
        minWidth: 0,
    },
    fullWidth: {
        gridColumn: '1 / -1',
    },
    cardHeader: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacingHorizontalS,
    },
    cardTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
    list: {
        listStyleType: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
        maxHeight: '420px',
        overflowY: 'auto',
    },
    listItem: {
        display: 'grid',
        gridTemplateColumns: '36px minmax(0, 1fr)',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
    },
    rankBadge: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: tokens.borderRadiusCircular,
        backgroundColor: tokens.colorNeutralBackground3,
        color: tokens.colorNeutralForeground1,
        fontWeight: tokens.fontWeightSemibold,
        fontFamily: tokens.fontFamilyBase,
        fontVariantNumeric: 'tabular-nums',
    },
    rankBadgeTop: {
        backgroundColor: ACCENT,
        color: '#ffffff',
    },
    rowBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
        minWidth: 0,
    },
    rowLine: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacingHorizontalS,
        minWidth: 0,
    },
    count: {
        fontFamily: tokens.fontFamilyBase,
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
    },
    barTrack: {
        width: '100%',
        height: '10px',
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground4,
        overflow: 'hidden',
    },
    barTrackSmall: {
        height: '6px',
    },
    barFill: {
        display: 'block',
        height: '100%',
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: ACCENT,
        transitionProperty: 'width',
        transitionDuration: tokens.durationNormal,
    },
    barFillAlt: {
        backgroundColor: tokens.colorPaletteMarigoldBorderActive,
    },
    filterRow: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
    funCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXXS,
        width: '100%',
        minWidth: 0,
    },
    funLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
        fontFamily: tokens.fontFamilyBase,
        fontVariantNumeric: 'tabular-nums',
    },
    starIcon: {
        color: tokens.colorPaletteMarigoldForeground1,
    },
    gridWrap: {
        overflowX: 'auto',
        maxHeight: '460px',
        overflowY: 'auto',
    },
    centered: {
        display: 'flex',
        justifyContent: 'center',
        padding: tokens.spacingVerticalXXL,
    },
    emptyState: {
        padding: tokens.spacingVerticalL,
        textAlign: 'center',
        color: tokens.colorNeutralForeground3,
    },
    errorBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        padding: tokens.spacingHorizontalM,
        backgroundColor: tokens.colorStatusDangerBackground1,
        color: tokens.colorStatusDangerForeground1,
        borderRadius: tokens.borderRadiusMedium,
    },
});

// ---------- Sub-components ----------

function StatCard(props: { icon: JSX.Element; label: string; value: string; hint?: string }) {
    const styles = useStyles();
    return (
        <Card className={styles.statCard} role="group" aria-label={`${props.label}: ${props.value}`}>
            <span className={styles.statIcon} aria-hidden="true">
                {props.icon}
            </span>
            <div className={styles.statText}>
                <Text size={200}>{props.label}</Text>
                <Text size={500} weight="semibold" className={styles.truncate} title={props.value}>
                    {props.value}
                </Text>
                {props.hint && (
                    <Text size={200} className={styles.truncate}>
                        {props.hint}
                    </Text>
                )}
            </div>
        </Card>
    );
}

function Bar(props: { percent: number; small?: boolean; alt?: boolean }) {
    const styles = useStyles();
    const pct = Math.max(0, Math.min(100, props.percent));
    return (
        <div className={mergeClasses(styles.barTrack, props.small && styles.barTrackSmall)} aria-hidden="true">
            <div className={mergeClasses(styles.barFill, props.alt && styles.barFillAlt)} style={{ width: `${pct}%` }} />
        </div>
    );
}

function PlayerRanking(props: { players: PlayerStat[]; totalWins: number }) {
    const styles = useStyles();
    if (props.players.length === 0) {
        return <Text className={styles.emptyState}>No players match the current filters.</Text>;
    }
    return (
        <ol className={styles.list} aria-label="Players ranked by wins">
            {props.players.map((p) => (
                <li
                    key={p.id}
                    className={styles.listItem}
                    aria-label={`Rank ${p.rank}: ${p.name}, ${pluralize(p.wins, 'win', 'wins')}`}
                >
                    <span
                        className={mergeClasses(styles.rankBadge, p.rank <= 3 && p.wins > 0 && styles.rankBadgeTop)}
                        aria-hidden="true"
                    >
                        {p.rank}
                    </span>
                    <div className={styles.rowBody} aria-hidden="true">
                        <div className={styles.rowLine}>
                            <Text weight="semibold" className={styles.truncate} title={p.name}>
                                {p.name}
                            </Text>
                            <Text className={styles.count}>
                                {pluralize(p.wins, 'win', 'wins')}
                                {props.totalWins > 0 ? ` · ${Math.round((p.wins / props.totalWins) * 100)}%` : ''}
                            </Text>
                        </div>
                        <Bar percent={p.share} />
                    </div>
                </li>
            ))}
        </ol>
    );
}

function MostPlayed(props: { games: GameStat[] }) {
    const styles = useStyles();
    const played = props.games.filter((g) => g.plays > 0).sort((a, b) => b.plays - a.plays || a.name.localeCompare(b.name));
    const top = played.slice(0, 8);
    const max = top.length > 0 ? top[0].plays : 0;
    if (top.length === 0) {
        return <Text className={styles.emptyState}>No played games match the current filters.</Text>;
    }
    return (
        <ol className={styles.list} aria-label="Most-played board games">
            {top.map((g, index) => (
                <li
                    key={g.id}
                    className={styles.listItem}
                    aria-label={`${index + 1}. ${g.name}, played ${pluralize(g.plays, 'time', 'times')}`}
                >
                    <span className={mergeClasses(styles.rankBadge, index < 3 && styles.rankBadgeTop)} aria-hidden="true">
                        {index + 1}
                    </span>
                    <div className={styles.rowBody} aria-hidden="true">
                        <div className={styles.rowLine}>
                            <Text weight="semibold" className={styles.truncate} title={g.name}>
                                {g.name}
                            </Text>
                            <Text className={styles.count}>{pluralize(g.plays, 'play', 'plays')}</Text>
                        </div>
                        <Bar percent={max > 0 ? (g.plays / max) * 100 : 0} />
                    </div>
                </li>
            ))}
        </ol>
    );
}

function FunCell(props: { game: GameStat }) {
    const styles = useStyles();
    const { avgFun, ratedCount } = props.game;
    return (
        <div className={styles.funCell}>
            <span className={styles.funLabel}>
                {avgFun === null ? (
                    <StarRegular className={styles.starIcon} aria-hidden="true" />
                ) : (
                    <StarFilled className={styles.starIcon} aria-hidden="true" />
                )}
                <Text>{formatFun(avgFun)}</Text>
                {ratedCount > 0 && <Text size={200}>({pluralize(ratedCount, 'rating', 'ratings')})</Text>}
            </span>
            {avgFun !== null && <Bar percent={(avgFun / 5) * 100} small alt />}
        </div>
    );
}

function buildGameColumns(): TableColumnDefinition<GameStat>[] {
    return [
        createTableColumn<GameStat>({
            columnId: 'name',
            compare: (a, b) => a.name.localeCompare(b.name),
            renderHeaderCell: () => 'Game',
            renderCell: (item) => (
                <TableCellLayout style={{ overflow: 'hidden', minWidth: 0 }}>
                    <span
                        title={item.name}
                        style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                        {item.name}
                    </span>
                </TableCellLayout>
            ),
        }),
        createTableColumn<GameStat>({
            columnId: 'complexity',
            compare: (a, b) => (a.complexity ?? Number.MAX_SAFE_INTEGER) - (b.complexity ?? Number.MAX_SAFE_INTEGER),
            renderHeaderCell: () => 'Complexity',
            renderCell: (item) => (
                <TableCellLayout>
                    {item.complexityLabel === '—' ? (
                        '—'
                    ) : (
                        <Badge appearance="tint" color="brand" shape="rounded">
                            {item.complexityLabel}
                        </Badge>
                    )}
                </TableCellLayout>
            ),
        }),
        createTableColumn<GameStat>({
            columnId: 'plays',
            compare: (a, b) => a.plays - b.plays,
            renderHeaderCell: () => 'Plays',
            renderCell: (item) => <TableCellLayout>{item.plays}</TableCellLayout>,
        }),
        createTableColumn<GameStat>({
            columnId: 'avgFun',
            compare: (a, b) => (a.avgFun ?? -1) - (b.avgFun ?? -1),
            renderHeaderCell: () => 'Average fun rating',
            renderCell: (item) => <FunCell game={item} />,
        }),
    ];
}

// ---------- Main component ----------

const GeneratedComponent = (props: LeaderboardProps) => {
    const { dataApi, pageInput } = props;
    void pageInput; // analytics page takes no input; destructured per rules
    const styles = useStyles();

    const [data, setData] = useState<{ bundle: Bundle | null; loading: boolean; error: string | null }>(() => {
        const cached = winAny[CACHE_KEY] as Bundle | undefined;
        return { bundle: cached ?? null, loading: cached === undefined, error: null };
    });
    const [reloadKey, setReloadKey] = useState(0);
    const [search, setSearch] = useState('');
    const [showWinless, setShowWinless] = useState(false);
    const [showUnplayed, setShowUnplayed] = useState(false);
    const [complexity, setComplexity] = useState<ComplexityFilter>('all');

    const dataReady = !!dataApi;

    useEffect(() => {
        if (!dataReady) return;

        const cached = winAny[CACHE_KEY] as Bundle | undefined;
        if (cached !== undefined) {
            if (data.bundle !== cached) setData({ bundle: cached, loading: false, error: null });
            return;
        }
        let cancelled = false;

        let inflight = winAny[INFLIGHT_KEY] as Promise<Bundle> | undefined;
        if (!inflight) {
            inflight = loadBundle(dataApi)
                .then((bundle) => {
                    winAny[CACHE_KEY] = bundle;
                    return bundle;
                })
                .finally(() => {
                    if (winAny[INFLIGHT_KEY] === inflight) delete winAny[INFLIGHT_KEY];
                });
            winAny[INFLIGHT_KEY] = inflight;
        }

        inflight
            .then((bundle) => {
                if (!cancelled) setData({ bundle, loading: false, error: null });
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                console.error('Failed to load leaderboard data:', err);
                setData({ bundle: null, loading: false, error: 'Unable to load game results. Please try again.' });
            });

        return () => {
            cancelled = true;
        };
        // Readiness + reloadKey only — never `dataApi` (new reference every render).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataReady, reloadKey]);

    const handleRefresh = useCallback(() => {
        delete winAny[CACHE_KEY];
        delete winAny[INFLIGHT_KEY];
        setData((prev) => ({ bundle: prev.bundle, loading: true, error: null }));
        setReloadKey((k) => k + 1);
    }, []);

    const playerStats = useMemo(() => computePlayerStats(data.bundle), [data.bundle]);
    const gameStats = useMemo(() => computeGameStats(data.bundle), [data.bundle]);
    const columns = useMemo(() => buildGameColumns(), []);

    const term = search.trim().toLowerCase();

    const visiblePlayers = useMemo(
        () =>
            playerStats.filter(
                (p) => (showWinless || p.wins > 0) && (term === '' || p.name.toLowerCase().includes(term)),
            ),
        [playerStats, showWinless, term],
    );

    const complexityGames = useMemo(
        () =>
            gameStats.filter((g) => {
                if (complexity !== 'all' && g.complexity !== COMPLEXITY_FILTER_VALUES[complexity]) return false;
                return term === '' || g.name.toLowerCase().includes(term);
            }),
        [gameStats, complexity, term],
    );

    const ratingGames = useMemo(
        () => complexityGames.filter((g) => showUnplayed || g.plays > 0),
        [complexityGames, showUnplayed],
    );

    const summary = useMemo(() => {
        const results = data.bundle?.results ?? [];
        const rated = results.filter((r) => r.fun !== undefined);
        const avg = rated.length > 0 ? rated.reduce((sum, r) => sum + (r.fun ?? 0), 0) / rated.length : null;
        const totalWins = results.filter((r) => !!r.winnerId).length;
        const champion = playerStats.length > 0 && playerStats[0].wins > 0 ? playerStats[0] : null;
        const coChampions = champion ? playerStats.filter((p) => p.wins === champion.wins).length : 0;
        const topGame = gameStats.reduce<GameStat | null>(
            (best, g) => (g.plays > 0 && (!best || g.plays > best.plays) ? g : best),
            null,
        );
        return { totalResults: results.length, totalWins, avg, champion, coChampions, topGame };
    }, [data.bundle, playerStats, gameStats]);

    const hasResults = summary.totalResults > 0;

    return (
        <main className={styles.root} aria-labelledby="leaderboard-title" aria-busy={data.loading}>
            <header className={styles.header}>
                <div className={styles.titleBlock}>
                    <TrophyFilled className={styles.titleIcon} aria-hidden="true" />
                    <div className={styles.titleText}>
                        <Text as="h1" id="leaderboard-title" size={700} weight="semibold">
                            Leaderboard
                        </Text>
                        <Text size={300}>Wins, most-played games and fun ratings from every game result</Text>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <SearchBox
                        className={styles.search}
                        placeholder="Search players or games"
                        value={search}
                        onChange={(_, d) => setSearch(d.value ?? '')}
                        aria-label="Search players or games"
                    />
                    <Button
                        appearance="secondary"
                        icon={<ArrowClockwiseRegular />}
                        onClick={handleRefresh}
                        disabled={data.loading}
                        aria-label="Refresh leaderboard"
                    >
                        Refresh
                    </Button>
                </div>
            </header>

            {data.error && (
                <div role="alert" className={styles.errorBanner}>
                    <ErrorCircleRegular aria-hidden="true" />
                    <Text>{data.error}</Text>
                </div>
            )}

            {data.loading && !data.bundle ? (
                <div className={styles.centered}>
                    <Spinner labelPosition="below" label="Loading leaderboard…" />
                </div>
            ) : (
                <>
                    {data.loading && <Spinner size="tiny" label="Refreshing…" labelPosition="after" />}

                    <section className={styles.summaryGrid} aria-label="Leaderboard summary">
                        <StatCard
                            icon={<TrophyRegular />}
                            label="Reigning champion"
                            value={summary.champion ? summary.champion.name : 'No winner yet'}
                            hint={
                                summary.champion
                                    ? `${pluralize(summary.champion.wins, 'win', 'wins')}${
                                          summary.coChampions > 1 ? ` · tied with ${summary.coChampions - 1} more` : ''
                                      }`
                                    : undefined
                            }
                        />
                        <StatCard
                            icon={<GamesRegular />}
                            label="Games logged"
                            value={String(summary.totalResults)}
                            hint={summary.topGame ? `Most played: ${summary.topGame.name}` : undefined}
                        />
                        <StatCard
                            icon={<PeopleRegular />}
                            label="Players with a win"
                            value={String(playerStats.filter((p) => p.wins > 0).length)}
                            hint={`${pluralize(playerStats.length, 'player', 'players')} in total`}
                        />
                        <StatCard
                            icon={<StarFilled />}
                            label="Average fun rating"
                            value={formatFun(summary.avg)}
                            hint="Across all rated results"
                        />
                    </section>

                    {!hasResults && !data.error ? (
                        <Card className={styles.card}>
                            <Text className={styles.emptyState}>
                                No game results recorded yet. Log a result to start the leaderboard.
                            </Text>
                        </Card>
                    ) : (
                        <div className={styles.mainGrid}>
                            <Card className={styles.card} role="region" aria-labelledby="ranking-title">
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitle}>
                                        <TrophyRegular aria-hidden="true" />
                                        <Text as="h2" id="ranking-title" size={500} weight="semibold">
                                            Player rankings
                                        </Text>
                                    </div>
                                    <Switch
                                        label="Show players without wins"
                                        checked={showWinless}
                                        onChange={(_, d) => setShowWinless(d.checked)}
                                    />
                                </div>
                                <PlayerRanking players={visiblePlayers} totalWins={summary.totalWins} />
                            </Card>

                            <Card className={styles.card} role="region" aria-labelledby="mostplayed-title">
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitle}>
                                        <GamesRegular aria-hidden="true" />
                                        <Text as="h2" id="mostplayed-title" size={500} weight="semibold">
                                            Most-played games
                                        </Text>
                                    </div>
                                    <Text size={200}>Top 8 by plays</Text>
                                </div>
                                <MostPlayed games={complexityGames} />
                            </Card>

                            <Card
                                className={mergeClasses(styles.card, styles.fullWidth)}
                                role="region"
                                aria-labelledby="fun-title"
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitle}>
                                        <StarFilled className={styles.starIcon} aria-hidden="true" />
                                        <Text as="h2" id="fun-title" size={500} weight="semibold">
                                            Average fun rating per game
                                        </Text>
                                    </div>
                                    <Switch
                                        label="Show unplayed games"
                                        checked={showUnplayed}
                                        onChange={(_, d) => setShowUnplayed(d.checked)}
                                    />
                                </div>
                                <div className={styles.filterRow} role="group" aria-label="Filter games by complexity">
                                    <Text size={200}>Complexity:</Text>
                                    {COMPLEXITY_OPTIONS.map((opt) => (
                                        <ToggleButton
                                            key={opt.key}
                                            size="small"
                                            shape="circular"
                                            checked={complexity === opt.key}
                                            aria-pressed={complexity === opt.key}
                                            onClick={() => setComplexity(opt.key)}
                                        >
                                            {opt.label}
                                        </ToggleButton>
                                    ))}
                                </div>
                                {ratingGames.length === 0 ? (
                                    <Text className={styles.emptyState}>No games match the current filters.</Text>
                                ) : (
                                    <div className={styles.gridWrap}>
                                        <DataGrid
                                            items={ratingGames}
                                            columns={columns}
                                            getRowId={(item) => item.id}
                                            sortable
                                            defaultSortState={{ sortColumn: 'avgFun', sortDirection: 'descending' }}
                                            resizableColumns
                                            columnSizingOptions={{
                                                name: { defaultWidth: 240, minWidth: 160 },
                                                complexity: { defaultWidth: 130, minWidth: 110 },
                                                plays: { defaultWidth: 90, minWidth: 80 },
                                                avgFun: { defaultWidth: 280, minWidth: 200 },
                                            }}
                                            aria-label="Average fun rating per game"
                                        >
                                            <DataGridHeader>
                                                <DataGridRow>
                                                    {({ renderHeaderCell }) => (
                                                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                                                    )}
                                                </DataGridRow>
                                            </DataGridHeader>
                                            <DataGridBody<GameStat>>
                                                {({ item, rowId }) => (
                                                    <DataGridRow<GameStat> key={rowId}>
                                                        {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                                                    </DataGridRow>
                                                )}
                                            </DataGridBody>
                                        </DataGrid>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </>
            )}
        </main>
    );
};

export default GeneratedComponent;
