import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import incidentPage from '../../client/index.html'

UiPage({
    $id: Now.ID['incident-manager-page'],
    endpoint: 'x_121762_my_dashbo_dashboard_directory.do',
    description: 'Dashboard Directory',
    category: 'general',
    html: incidentPage,
    direct: true,
})
