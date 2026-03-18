import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '377ef879bf11401eb4daeee5e27c0c57'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '8bd4ea1a4a344c678ff078cf9b12170e'
                    }
                }
                composite: [
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '2f10ae6e2eaa41eb9c09b2a2c61f1729'
                        deleted: true
                        key: {
                            application_file: '34ff804d687c465ebc03d41b89e4d9ce'
                            source_artifact: '8e2f87a1847240a29339625d6dcfe5eb'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '2f90c27660314fa385626546dee61996'
                        key: {
                            application_file: 'c79cdb88ed104d5ca1ac7c7dfc3d61cd'
                            source_artifact: '7b17b120e51f401ca645f9a71a8122c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '34ff804d687c465ebc03d41b89e4d9ce'
                        key: {
                            name: 'x_121762_my_dashbo/main'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '65c002f6ca7644ec896fa9c24164c374'
                        key: {
                            application_file: '34ff804d687c465ebc03d41b89e4d9ce'
                            source_artifact: '7b17b120e51f401ca645f9a71a8122c6'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '7265773ad8cb4e5d83555bca954e7d39'
                        key: {
                            application_file: '9da2bcc962f74af1aa61276fa89a9c9f'
                            source_artifact: '7b17b120e51f401ca645f9a71a8122c6'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: '7b17b120e51f401ca645f9a71a8122c6'
                        key: {
                            name: 'x_121762_my_dashbo_dashboard_directory.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '8ae9bc9efe7c47269488cc18a139f758'
                        deleted: true
                        key: {
                            application_file: '92980971c17f41d2b153f3d06d111f68'
                            source_artifact: '8e2f87a1847240a29339625d6dcfe5eb'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: '8e2f87a1847240a29339625d6dcfe5eb'
                        deleted: true
                        key: {
                            name: 'x_121762_my_dashbo_incident_manager.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: '92980971c17f41d2b153f3d06d111f68'
                        deleted: true
                        key: {
                            endpoint: 'x_121762_my_dashbo_incident_manager.do'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9da2bcc962f74af1aa61276fa89a9c9f'
                        key: {
                            name: 'x_121762_my_dashbo/main.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '9f680eb2cedc460e8efe2afa52844043'
                        deleted: true
                        key: {
                            application_file: '9da2bcc962f74af1aa61276fa89a9c9f'
                            source_artifact: '8e2f87a1847240a29339625d6dcfe5eb'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: 'c79cdb88ed104d5ca1ac7c7dfc3d61cd'
                        key: {
                            endpoint: 'x_121762_my_dashbo_dashboard_directory.do'
                        }
                    },
                ]
            }
        }
    }
}
