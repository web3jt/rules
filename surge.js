const axios = require('axios')
const config = require("./util/config")
const fs = require("fs")

class Proxy {
    constructor(line) {
        this.name = line.split('=')[0].trim()
        this.line = line
    }
}

class Group {
    constructor(name) {
        this.name = name
        this.proxies = []
    }

    get valid() {
        return this.proxies.length > 1
    }

    get auto() {
        if (!this.proxies.length || this.proxies.length === 1) {
            return ''
        }

        // prefix
        let arr = [
            `${this.name} = url-test`
        ]

        // list
        for (const p of this.proxies) {
            arr = arr.concat([p.name])
        }

        // suffix
        arr = arr.concat([
            // 'url = http://cp.cloudflare.com/generate_204',
            'url = http://www.gstatic.com/generate_204',
            'interval = 3600',
            'tolerance = 100'
        ])

        return arr.join(', ')
    }

    get select() {
        if (!this.proxies.length || this.proxies.length === 1) {
            return ''
        }

        // prefix
        let arr = [
            `${this.name} = select`
        ]

        for (const p of this.proxies) {
            arr = arr.concat([p.name])
        }

        return arr.join(', ')
    }

    exportSelect(name='') {
        if (!this.proxies.length || this.proxies.length === 1) {
            return ''
        }

        // prefix
        let arr = [
            `${name} = select`
        ]

        for (const p of this.proxies) {
            arr = arr.concat([p.name])
        }

        return arr.join(', ')
    }
}

class Groups {
    constructor() {
        this.groups = []
    }

    push(group) {
        this.groups.push(group)
    }

    get names() {
        const names = []

        for (const group of this.groups) {
            if (group.proxies.length === 1) {
                names.push(group.proxies[0].name)
            } else {
                names.push(group.name)
            }
        }

        return names
    }
}

class Outbound {
    constructor(name) {
        this.name = name
    }

    select(names) {
        let arr = [
            `${this.name} = select`
        ]

        arr = arr.concat(names)

        return arr.join(', ')
    }

    proxyFirst(names) {
        let arr = [
            `${this.name} = select`,
            `Proxy`,
            `Domestic`,
            `Direct`,
        ]

        arr = arr.concat(names)

        return arr.join(', ')
    }

    directFirst(names) {
        let arr = [
            `${this.name} = select`,
            `Direct`,
            `Domestic`,
            `Proxy`,
        ]

        arr = arr.concat(names)

        return arr.join(', ')
    }

    domesticFirst(names) {
        let arr = [
            `${this.name} = select`,
            `Domestic`,
            `Direct`,
            `Proxy`,
        ]

        arr = arr.concat(names)

        return arr.join(', ')
    }
}


const getConfHead = function () {
    const confGeneral = fs.readFileSync('./surge/0.general.conf', 'utf8')
    const confReplica = fs.readFileSync('./surge/1.replica.conf', 'utf8')

    return confGeneral + confReplica
}

const getConfTail = function () {
    const confRule = fs.readFileSync('./surge/2.rule.conf', 'utf8')
    const confHost = fs.readFileSync('./surge/3.host.conf', 'utf8')
    const confURLRewrite = fs.readFileSync('./surge/4.url-rewrite.conf', 'utf8')
    const confMITM = fs.readFileSync('./surge/5.mitm.conf', 'utf8')
    const confScript = fs.readFileSync('./surge/6.script.conf', 'utf8')

    return confRule + confHost + confURLRewrite + confMITM + confScript
}


const main = async function () {
    const ONLY = new Group('🌎 ONLY')
    const NEAR = new Group('🏠 NEAR')
    const IEPL = new Group('🚀 IEPL')
    const BGP = new Group('✈ BGP')
    const IEPL_BGP = new Group('🚅 IEPL_BGP')

    const HK = new Group('🇭🇰 香港')
    const HK_BGP = new Group('🇭🇰 香港 BGP')
    const HK_IEPL = new Group('🇭🇰 香港 IEPL')

    const TW = new Group('🇨🇳 台湾')
    const TW_BGP = new Group('🇨🇳 台湾 BGP')
    const TW_IEPL = new Group('🇨🇳 台湾 IEPL')

    const SG = new Group('🇸🇬 新加坡')
    const SG_BGP = new Group('🇸🇬 新加坡 BGP')
    const SG_IEPL = new Group('🇸🇬 新加坡 IEPL')

    const JP = new Group('🇯🇵 日本')
    const JP_BGP = new Group('🇯🇵 日本 BGP')
    const JP_IEPL = new Group('🇯🇵 日本 IEPL')

    const KR = new Group('🇰🇷 韩国')
    const KR_BGP = new Group('🇰🇷 韩国 BGP')
    const KR_IEPL = new Group('🇰🇷 韩国 IEPL')

    const US = new Group('🇺🇸 美国')
    const US_BGP = new Group('🇺🇸 美国 BGP')
    const US_IEPL = new Group('🇺🇸 美国 IEPL')

    const CA = new Group('🇨🇦 加拿大')
    const CA_BGP = new Group('🇨🇦 加拿大 BGP')
    const CA_IEPL = new Group('🇨🇦 加拿大 IEPL')

    const GB = new Group('🇬🇧 英国')
    const GB_BGP = new Group('🇬🇧 英国 BGP')
    const GB_IEPL = new Group('🇬🇧 英国 IEPL')

    const DE = new Group('🇩🇪 德国')
    const DE_BGP = new Group('🇩🇪 德国 BGP')
    const DE_IEPL = new Group('🇩🇪 德国 IEPL')

    const AU = new Group('🇦🇺 澳大利亚')
    const AU_BGP = new Group('🇦🇺 澳大利亚 BGP')
    const AU_IEPL = new Group('🇦🇺 澳大利亚 IEPL')

    const IN = new Group('🇮🇳 印度')
    const IN_BGP = new Group('🇮🇳 印度 BGP')
    const IN_IEPL = new Group('🇮🇳 印度 IEPL')

    const PH = new Group('🇵🇭 菲律宾')
    const PH_BGP = new Group('🇵🇭 菲律宾 BGP')
    const PH_IEPL = new Group('🇵🇭 菲律宾 IEPL')

    const AR = new Group('🇦🇷 阿根廷')
    const AR_BGP = new Group('🇦🇷 阿根廷 BGP')
    const AR_IEPL = new Group('🇦🇷 阿根廷 IEPL')

    const groups = new Groups()

    


    // outbound
    const oProxy = new Outbound('Proxy')
    const oOthers = new Outbound('Others')
    const oApple = new Outbound('Apple')
    const oGoogleFCM = new Outbound('GoogleFCM')
    const oScholar = new Outbound('Scholar')
    const oAsianTV = new Outbound('AsianTV')
    const oGlobalTV = new Outbound('GlobalTV')
    const oNetflix = new Outbound('Netflix')
    const oDisney = new Outbound('Disney')
    const oSpotify = new Outbound('Spotify')
    const oYouTube = new Outbound('YouTube')
    const oClubhouse = new Outbound('Clubhouse')
    const oAgora = new Outbound('Agora')
    const oTelegram = new Outbound('Telegram')
    const oSteam = new Outbound('Steam')
    const oPayPal = new Outbound('PayPal')
    const oMicrosoft = new Outbound('Microsoft')

    // download managed config
    const resp = await axios.get(config['SURGE_PROVIDER'])
    const lines = resp.data.split('\n')

    let confProxy = [
        '[Proxy]',
        'Direct = direct',
        'Reject = reject',
    ]

    for (const line of lines) {
        const t = line.trim()
        if (t) {
            const p = new Proxy(t)
            confProxy.push(t)

            // ONLY
            ONLY.proxies.push(p)

            // IEPL
            if (p.name.indexOf('IEPL') !== -1) {
                IEPL.proxies.push(p)
                IEPL_BGP.proxies.push(p)
            }

            // BGP
            if (p.name.indexOf('BGP') !== -1) {
                BGP.proxies.push(p)
                IEPL_BGP.proxies.push(p)
            }

            // Countries
            if (p.name.indexOf('香港') !== -1) {
                HK.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    HK_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    HK_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('台湾') !== -1) {
                TW.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    TW_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    TW_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('新加坡') !== -1) {
                SG.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    SG_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    SG_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('日本') !== -1) {
                JP.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    JP_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    JP_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('韩国') !== -1) {
                KR.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    KR_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    KR_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('美国') !== -1) {
                US.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    US_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    US_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('加拿大') !== -1) {
                CA.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    CA_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    CA_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('英国') !== -1) {
                GB.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    GB_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    GB_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('德国') !== -1) {
                DE.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    DE_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    DE_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('澳大利亚') !== -1) {
                AU.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    AU_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    AU_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('印度') !== -1) {
                IN.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    IN_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    IN_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('菲律宾') !== -1) {
                PH.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    PH_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    PH_BGP.proxies.push(p)
                }
            } else if (p.name.indexOf('阿根廷') !== -1) {
                AR.proxies.push(p)
                if (p.name.indexOf('IEPL') !== -1) {
                    AR_IEPL.proxies.push(p)
                } else if (p.name.indexOf('BGP') !== -1) {
                    AR_BGP.proxies.push(p)
                }
            }
        }
    }

    NEAR.proxies = NEAR.proxies.concat(
        HK_IEPL.proxies,
        HK_BGP.proxies,
        TW_IEPL.proxies,
        TW_BGP.proxies,
        SG_IEPL.proxies,
        SG_BGP.proxies,
        JP_IEPL.proxies,
        JP_BGP.proxies,
        KR_IEPL.proxies,
        KR_BGP.proxies
    )

    confProxy = confProxy.concat([
        '',
        '',
        '',
    ])

    let confProxyGroup = [
        `[Proxy Group]`
    ]

    if (ONLY.valid) confProxyGroup = confProxyGroup.concat([ONLY.select])
    if (NEAR.valid) confProxyGroup = confProxyGroup.concat([NEAR.auto])
    if (IEPL.valid) confProxyGroup = confProxyGroup.concat([IEPL.auto])
    if (BGP.valid) confProxyGroup = confProxyGroup.concat([BGP.auto])
    if (IEPL_BGP.valid) confProxyGroup = confProxyGroup.concat([IEPL_BGP.auto])

    confProxyGroup.push('')
    if (HK_IEPL.valid) confProxyGroup = confProxyGroup.concat([HK_IEPL.auto])
    if (HK_BGP.valid) confProxyGroup = confProxyGroup.concat([HK_BGP.auto])
    if (HK.valid) confProxyGroup = confProxyGroup.concat([HK.auto])

    if (TW_IEPL.valid) confProxyGroup = confProxyGroup.concat([TW_IEPL.auto])
    if (TW_BGP.valid) confProxyGroup = confProxyGroup.concat([TW_BGP.auto])
    if (TW.valid) confProxyGroup = confProxyGroup.concat([TW.auto])

    if (SG_IEPL.valid) confProxyGroup = confProxyGroup.concat([SG_IEPL.auto])
    if (SG_BGP.valid) confProxyGroup = confProxyGroup.concat([SG_BGP.auto])
    if (SG.valid) confProxyGroup = confProxyGroup.concat([SG.auto])

    if (JP_IEPL.valid) confProxyGroup = confProxyGroup.concat([JP_IEPL.auto])
    if (JP_BGP.valid) confProxyGroup = confProxyGroup.concat([JP_BGP.auto])
    if (JP.valid) confProxyGroup = confProxyGroup.concat([JP.auto])

    if (KR_IEPL.valid) confProxyGroup = confProxyGroup.concat([KR_IEPL.auto])
    if (KR_BGP.valid) confProxyGroup = confProxyGroup.concat([KR_BGP.auto])
    if (KR.valid) confProxyGroup = confProxyGroup.concat([KR.auto])

    if (US_IEPL.valid) confProxyGroup = confProxyGroup.concat([US_IEPL.auto])
    if (US_BGP.valid) confProxyGroup = confProxyGroup.concat([US_BGP.auto])
    if (US.valid) confProxyGroup = confProxyGroup.concat([US.auto])

    if (CA_IEPL.valid) confProxyGroup = confProxyGroup.concat([CA_IEPL.auto])
    if (CA_BGP.valid) confProxyGroup = confProxyGroup.concat([US_BGP.auto])
    if (CA.valid) confProxyGroup = confProxyGroup.concat([CA.auto])

    if (GB_IEPL.valid) confProxyGroup = confProxyGroup.concat([GB_IEPL.auto])
    if (GB_BGP.valid) confProxyGroup = confProxyGroup.concat([GB_BGP.auto])
    if (GB.valid) confProxyGroup = confProxyGroup.concat([GB.auto])

    if (DE_IEPL.valid) confProxyGroup = confProxyGroup.concat([DE_IEPL.auto])
    if (DE_BGP.valid) confProxyGroup = confProxyGroup.concat([DE_BGP.auto])
    if (DE.valid) confProxyGroup = confProxyGroup.concat([DE.auto])

    if (AU_IEPL.valid) confProxyGroup = confProxyGroup.concat([AU_IEPL.auto])
    if (AU_BGP.valid) confProxyGroup = confProxyGroup.concat([AU_BGP.auto])
    if (AU.valid) confProxyGroup = confProxyGroup.concat([AU.auto])

    if (IN_IEPL.valid) confProxyGroup = confProxyGroup.concat([IN_IEPL.auto])
    if (IN_BGP.valid) confProxyGroup = confProxyGroup.concat([IN_BGP.auto])
    if (IN.valid) confProxyGroup = confProxyGroup.concat([IN.auto])

    if (PH_IEPL.valid) confProxyGroup = confProxyGroup.concat([PH_IEPL.auto])
    if (PH_BGP.valid) confProxyGroup = confProxyGroup.concat([PH_BGP.auto])
    if (PH.valid) confProxyGroup = confProxyGroup.concat([PH.auto])

    if (AR_IEPL.valid) confProxyGroup = confProxyGroup.concat([AR_IEPL.auto])
    if (AR_BGP.valid) confProxyGroup = confProxyGroup.concat([AR_BGP.auto])
    if (AR.valid) confProxyGroup = confProxyGroup.concat([AR.auto])

    // Groups
    if (HK_IEPL.proxies.length) groups.push(HK_IEPL)
    if (ONLY.proxies.length) groups.push(ONLY)
    if (NEAR.proxies.length) groups.push(NEAR)
    if (IEPL.proxies.length) groups.push(IEPL)
    if (IEPL_BGP.proxies.length) groups.push(IEPL_BGP)
    if (BGP.proxies.length) groups.push(BGP)

    if (HK_BGP.proxies.length) groups.push(HK_BGP)
    if (TW_IEPL.proxies.length) groups.push(TW_IEPL)
    if (TW_BGP.proxies.length) groups.push(TW_BGP)
    if (SG_IEPL.proxies.length) groups.push(SG_IEPL)
    if (SG_BGP.proxies.length) groups.push(SG_BGP)
    if (US_IEPL.proxies.length) groups.push(US_IEPL)
    if (US_BGP.proxies.length) groups.push(US_BGP)

    if (HK.proxies.length) groups.push(HK)
    if (TW.proxies.length) groups.push(TW)
    if (SG.proxies.length) groups.push(SG)
    if (US.proxies.length) groups.push(US)

    if (JP_IEPL.proxies.length) groups.push(JP_IEPL)
    if (JP_BGP.proxies.length) groups.push(JP_BGP)
    if (JP.proxies.length) groups.push(JP)
    if (KR_IEPL.proxies.length) groups.push(KR_IEPL)
    if (KR_BGP.proxies.length) groups.push(KR_BGP)
    if (KR.proxies.length) groups.push(KR)

    if (CA_IEPL.proxies.length) groups.push(CA_IEPL)
    if (GB_IEPL.proxies.length) groups.push(GB_IEPL)
    if (DE_IEPL.proxies.length) groups.push(DE_IEPL)
    if (AU_IEPL.proxies.length) groups.push(AU_IEPL)
    if (IN_IEPL.proxies.length) groups.push(IN_IEPL)
    if (PH_IEPL.proxies.length) groups.push(PH_IEPL)
    if (AR_IEPL.proxies.length) groups.push(AR_IEPL)

    if (CA_BGP.proxies.length) groups.push(CA_BGP)
    if (GB_BGP.proxies.length) groups.push(GB_BGP)
    if (DE_BGP.proxies.length) groups.push(DE_BGP)
    if (AU_BGP.proxies.length) groups.push(AU_BGP)
    if (IN_BGP.proxies.length) groups.push(IN_BGP)
    if (PH_BGP.proxies.length) groups.push(PH_BGP)
    if (AR_BGP.proxies.length) groups.push(AR_BGP)

    if (CA.proxies.length) groups.push(CA)
    if (GB.proxies.length) groups.push(GB)
    if (DE.proxies.length) groups.push(DE)
    if (AU.proxies.length) groups.push(AU)
    if (IN.proxies.length) groups.push(IN)
    if (PH.proxies.length) groups.push(PH)
    if (AR.proxies.length) groups.push(AR)



    confProxyGroup.push('')
    confProxyGroup.push(oProxy.select(groups.names))
    confProxyGroup.push('Domestic = select, Direct, Proxy')
    confProxyGroup.push(oApple.directFirst(groups.names))
    confProxyGroup.push(oGoogleFCM.directFirst(groups.names))
    confProxyGroup.push(oScholar.domesticFirst(groups.names))
    confProxyGroup.push(oAsianTV.domesticFirst(groups.names))
    confProxyGroup.push(oGlobalTV.proxyFirst(groups.names))
    confProxyGroup.push(oNetflix.proxyFirst(groups.names))
    confProxyGroup.push(oDisney.proxyFirst(groups.names))
    confProxyGroup.push(oSpotify.proxyFirst(groups.names))
    confProxyGroup.push(oYouTube.proxyFirst(groups.names))
    confProxyGroup.push(oClubhouse.proxyFirst(groups.names))
    confProxyGroup.push(oAgora.proxyFirst(groups.names))
    confProxyGroup.push(oTelegram.proxyFirst(groups.names))
    confProxyGroup.push(oSteam.proxyFirst(groups.names))
    confProxyGroup.push(oPayPal.proxyFirst(groups.names))
    confProxyGroup.push(oMicrosoft.domesticFirst(groups.names))
    confProxyGroup.push(ONLY.exportSelect('SpeedTest'))
    confProxyGroup.push(oOthers.proxyFirst(groups.names))

    confProxyGroup = confProxyGroup.concat([
        '',
        '',
        '',
    ])


    const confHeadText = getConfHead()
    const confProxyText = confProxy.join('\n')
    const confProxyGroupText = confProxyGroup.join('\n')
    const confTailText = getConfTail()

    const confText = confHeadText + confProxyText + confProxyGroupText + confTailText

    fs.writeFile(config['SURGE_OUTPUT'], confText, (err) => {
        if(err) throw err;
        console.log('Saved...');
    })
}

main()
