/**
 * Primary sidebar destinations, as verified against the live application.
 *
 * Split in two because the landing states differ:
 *
 * - `NAV_SECTIONS` render an `h2` naming the section, which is stable
 *   regardless of how much data the tenant holds.
 * - `NAV_SECTIONS_WITHOUT_HEADING` do not, so only the route and the app shell
 *   are asserted for them. Detections and Enrollment render onboarding empty
 *   states that change once the tenant configures EDR or APNs, and
 *   Vulnerabilities renders a marketing page until the feature is licensed.
 *   Asserting their copy would make the suite fail on a tenant change rather
 *   than on a regression.
 */
export const NAV_SECTIONS = [
    { link: 'Devices', route: '/devices', heading: 'Devices' },
    { link: 'Blueprints', route: '/blueprints', heading: 'Blueprints' },
    { link: 'Library', route: '/library', heading: 'Library' },
    { link: 'Users', route: '/users', heading: 'Users' },
    { link: 'Alerts', route: '/alerts/active', heading: 'Alerts' },
    { link: 'Activity', route: '/activity', heading: 'Activity' },
    { link: 'Resources', route: '/resources', heading: 'Resources' },
] as const;

export const NAV_SECTIONS_WITHOUT_HEADING = [
    { link: 'Detections', route: '/detections' },
    { link: 'Vulnerabilities', route: '/vulnerabilities' },
    { link: 'Enrollment', route: '/add-devices' },
] as const;
