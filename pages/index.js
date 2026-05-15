import Head from 'next/head'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    let appData = null

    fetch('/regimens.json')
      .then(r => r.json())
      .then(json => { appData = json })

    document.getElementById('stage').addEventListener('change', function () {
      const grp = document.getElementById('high_risk_group')
      grp.style.display = this.value === 'II' ? 'block' : 'none'
    })

    document.getElementById('treatment_line').addEventListener('change', function () {
      const historySection = document.getElementById('treatment_history_section')
      const needsHistory = ['second_after_ox', 'second_after_iri', 'third_plus'].includes(this.value)
      historySection.style.display = needsHistory ? 'block' : 'none'
    })

    function gradeClass(grade) {
      if (grade.includes('MSI') || grade.includes('dMMR') || grade.includes('TMB')) return 'grade-msi'
      if (grade.includes('BRAF')) return 'grade-braf'
      if (grade.includes('HER2')) return 'grade-her2'
      if (grade.includes('NTRK')) return 'grade-ntrk'
      if (grade.includes('RAS野生型')) return 'grade-conditional'
      return 'grade-standard'
    }

    function isApplicable(regimen, params) {
      const cond = regimen.condition
      if (!cond) return true
      if (cond.includes('RAS野生型') && params.ras === 'mut') return false
      if (cond.includes('BRAF V600E変異') && params.braf !== 'mut') return false
      if (cond.includes('MSI-H') && !cond.includes('TMB') && params.msi !== 'msi_h') return false
      if ((cond.includes('TMB-H') || (cond.includes('MSI-H') && cond.includes('TMB'))) &&
        params.msi !== 'msi_h' && params.msi !== 'tmb_h') return false
      if (cond.includes('HER2陽性') && params.her2 !== 'pos') return false
      return true
    }

    // 使用済み薬剤リストを取得
    function getUsedDrugs() {
      const usedDrugs = []
      const checkboxes = document.querySelectorAll('.prev-drug-check:checked')
      checkboxes.forEach(cb => usedDrugs.push(cb.value))
      return usedDrugs
    }

    // レジメン名から使用薬剤を判定してかぶりがあるかチェック
    function isRegimenConflicting(regimenName, usedDrugs) {
      if (usedDrugs.length === 0) return false
      const name = regimenName.toUpperCase()

      const drugPatterns = {
        'oxaliplatin': ['FOLFOX', 'CAPOX', 'XELOX', 'SOX', 'OX', 'オキサリプラチン'],
        'irinotecan': ['FOLFIRI', 'IRI', 'CPT-11', 'イリノテカン'],
        'bevacizumab': ['BEV', 'BEVACIZUMAB', 'ベバシズマブ', 'アバスチン'],
        'cetuximab': ['CET', 'CETUXIMAB', 'セツキシマブ', 'アービタックス'],
        'panitumumab': ['PANI', 'PANITUMUMAB', 'パニツムマブ', 'ベクティビックス'],
        'pembrolizumab': ['PEMBRO', 'PEMBROLIZUMAB', 'ペムブロリズマブ', 'キイトルーダ'],
        'nivolumab': ['NIVO', 'NIVOLUMAB', 'ニボルマブ', 'オプジーボ'],
        'ipilimumab': ['IPI', 'IPILIMUMAB', 'イピリムマブ', 'ヤーボイ'],
        'regorafenib': ['REGO', 'REGORAFENIB', 'レゴラフェニブ', 'スチバーガ'],
        'trifluridine': ['TAS-102', 'FTD', 'トリフルリジン', 'ロンサーフ'],
        'encorafenib': ['ENCO', 'ENCORAFENIB', 'エンコラフェニブ'],
        'binimetinib': ['BINI', 'BINIMETINIB', 'ビニメチニブ'],
        'ramucirumab': ['RAM', 'RAMUCIRUMAB', 'ラムシルマブ', 'サイラムザ'],
        'fluorouracil': ['5-FU', 'FU', 'フルオロウラシル', 'CAPECITABINE', 'カペシタビン', 'UFT', 'S-1'],
      }

      const conflicts = []
      for (const drug of usedDrugs) {
        const patterns = drugPatterns[drug] || []
        for (const pattern of patterns) {
          if (name.includes(pattern)) {
            conflicts.push(drug)
            break
          }
        }
      }
      return conflicts
    }

    function renderRegimen(reg, params) {
      const applicable = isApplicable(reg, params)
      const usedDrugs = getUsedDrugs()
      const conflicts = isRegimenConflicting(reg.name, usedDrugs)
      const hasConflict = conflicts.length > 0

      const condHtml = reg.condition ? `<span class="regimen-condition">適応条件：${reg.condition}</span>` : ''
      const noteHtml = reg.note ? `<span class="regimen-note">${reg.note}</span>` : ''

      let opacity = applicable ? '1' : '0.35'
      let borderStyle = applicable ? '' : 'border: 1px dashed #cbd5e0;'
      let conflictBadge = ''
      let conflictBanner = ''

      if (hasConflict && applicable) {
        opacity = '0.45'
        borderStyle = 'border: 2px dashed #e53e3e; background: #fff5f5;'
        const drugNames = {
          'oxaliplatin': 'OX（オキサリプラチン）',
          'irinotecan': 'IRI（イリノテカン）',
          'bevacizumab': 'BEV（ベバシズマブ）',
          'cetuximab': 'CET（セツキシマブ）',
          'panitumumab': 'PANI（パニツムマブ）',
          'pembrolizumab': 'PEMBRO（ペムブロリズマブ）',
          'nivolumab': 'NIVO（ニボルマブ）',
          'ipilimumab': 'IPI（イピリムマブ）',
          'regorafenib': 'REGO（レゴラフェニブ）',
          'trifluridine': 'TAS-102',
          'encorafenib': 'ENCO（エンコラフェニブ）',
          'binimetinib': 'BINI（ビニメチニブ）',
          'ramucirumab': 'RAM（ラムシルマブ）',
          'fluorouracil': '5-FU/フッ化ピリミジン系',
        }
        const conflictNames = conflicts.map(c => drugNames[c] || c).join('、')
        conflictBadge = `<span class="conflict-badge">⚠ 既使用</span>`
        conflictBanner = `<div class="conflict-note">既治療と重複：${conflictNames}</div>`
      }

      return `
        <div class="regimen-card" style="opacity:${opacity}; ${borderStyle}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <span class="regimen-name">${reg.name}</span>
            ${conflictBadge}
          </div>
          <div>
            <span class="regimen-grade ${gradeClass(reg.grade)}">${reg.grade}</span>
            ${condHtml}
          </div>
          ${conflictBanner}
          ${noteHtml ? `<div>${noteHtml}</div>` : ''}
        </div>`
    }

    window.resetForm = function () {
      ;['stage', 'treatment_line', 'ps', 'ras', 'braf', 'msi', 'her2', 'tumor_location', 'high_risk'].forEach(id => {
        const el = document.getElementById(id)
        if (el) el.value = ''
      })
      document.querySelectorAll('.prev-drug-check').forEach(cb => { cb.checked = false })
      document.getElementById('high_risk_group').style.display = 'none'
      document.getElementById('treatment_history_section').style.display = 'none'
      document.getElementById('result-content').innerHTML = `
        <div class="result-empty">
          <div class="icon">💊</div>
          患者情報を入力して「レジメンを検索」を<br>クリックしてください
        </div>`
    }

    window.search = function () {
      if (!appData) {
        document.getElementById('result-content').innerHTML =
          `<div class="alert-box">⚠️ データ読み込み中です。少し待ってからお試しください。</div>`
        return
      }

      const data = appData
      const params = {
        stage: document.getElementById('stage').value,
        high_risk: document.getElementById('high_risk').value,
        line: document.getElementById('treatment_line').value,
        ps: document.getElementById('ps').value,
        ras: document.getElementById('ras').value,
        braf: document.getElementById('braf').value,
        msi: document.getElementById('msi').value,
        her2: document.getElementById('her2').value,
        location: document.getElementById('tumor_location').value,
      }

      if (!params.stage || !params.line) {
        document.getElementById('result-content').innerHTML =
          `<div class="alert-box">⚠️ 「病期」と「治療ライン」は必須項目です。選択してください。</div>`
        return
      }

      // 治療歴サマリーを表示
      const usedDrugs = getUsedDrugs()
      let html = ''

      if (usedDrugs.length > 0 && ['second_after_ox', 'second_after_iri', 'third_plus'].includes(params.line)) {
        const drugLabels = {
          'oxaliplatin': 'OX',
          'irinotecan': 'IRI',
          'bevacizumab': 'BEV',
          'cetuximab': 'CET（抗EGFR）',
          'panitumumab': 'PANI（抗EGFR）',
          'pembrolizumab': 'PEMBRO',
          'nivolumab': 'NIVO',
          'ipilimumab': 'IPI',
          'regorafenib': 'レゴラフェニブ',
          'trifluridine': 'TAS-102',
          'encorafenib': 'エンコラフェニブ',
          'binimetinib': 'ビニメチニブ',
          'ramucirumab': 'ラムシルマブ',
          'fluorouracil': '5-FU/フッ化ピリミジン系',
        }
        const usedLabels = usedDrugs.map(d => drugLabels[d] || d).join('・')
        html += `<div class="history-summary-box">📋 既治療歴として登録：<strong>${usedLabels}</strong><br><span style="font-size:11px; color:#718096;">⚠ 印のレジメンは既使用薬剤と重複しています。薄く表示されています。</span></div>`
      }

      if (params.line === 'adjuvant') {
        if (params.stage === 'I') {
          html += `<div class="info-box">ℹ️ Stage Iに対する術後補助化学療法は通常推奨されません。</div>`
        } else if (params.stage === 'II' && params.high_risk !== 'high') {
          html += `<div class="info-box">ℹ️ 低リスクStage IIに対するルーチンの術後補助化学療法は推奨されません（個別に判断）。</div>`
        } else if (params.stage === 'II' || params.stage === 'III') {
          if (params.ps === '3_4') {
            html += `<div class="alert-box">⚠️ PS 3-4では化学療法の適応について慎重に検討が必要です。</div>`
          }
          html += `<div class="info-box">📋 適応：R0切除後 pStage III大腸癌、または高リスクpStage II大腸癌<br>投与期間：6カ月を原則</div>`
          const adj = data.adjuvant
          const oxRegimens = adj.regimens.filter(r => r.category === 'OX併用療法')
          const fpRegimens = adj.regimens.filter(r => r.category === 'フッ化ピリミジン単独')
          html += `<div class="section-title">OX併用療法（第一選択）</div>`
          oxRegimens.forEach(r => { html += renderRegimen(r, params) })
          html += `<div class="section-title">フッ化ピリミジン単独療法（OX不耐・高齢者など）</div>`
          fpRegimens.forEach(r => { html += renderRegimen(r, params) })
        } else {
          html += `<div class="alert-box">⚠️ 選択された病期では術後補助化学療法の適応は通常ありません。</div>`
        }
      } else {
        if (params.stage === 'IV_resectable') {
          html += `<div class="info-box">💡 切除可能なStage IVでは外科的切除（または変換療法）を優先的に考慮してください。全身薬物療法の方針は切除不能例に準じます。</div>`
        }

        if (params.ps === '3_4') {
          html += `<div class="alert-box">⚠️ PS 3-4（Frail）では積極的な薬物療法は適応とならない場合があります。最善支持療法（BSC）を考慮してください。</div>`
          document.getElementById('result-content').innerHTML = html
          return
        }

        const isVulnerable = params.ps === '2'
        let checkWarnings = []
        if (!params.ras) checkWarnings.push('RAS（KRAS/NRAS）遺伝子検査')
        if (!params.braf) checkWarnings.push('BRAF V600E遺伝子検査')
        if (!params.msi) checkWarnings.push('MSI/MMR-IHC検査')
        if (checkWarnings.length > 0) {
          html += `<div class="warning-box">⚠️ 以下の検査結果が未入力です。一次治療前に実施を推奨します：<br>• ${checkWarnings.join('<br>• ')}</div>`
        }

        if (params.msi === 'msi_h' || params.msi === 'tmb_h') {
          html += `<div class="section-title">🔬 MSI-H/dMMR / TMB-H：免疫チェックポイント阻害薬を優先考慮</div>`
          if (params.line === 'first') {
            data.unresectable.first_line.msi_h_priority.regimens.forEach(r => {
              html += renderRegimen(r, params)
            })
          }
        }

        if (params.line === 'first') {
          html += `<div class="section-title">${data.unresectable.first_line.label}</div>`
          if (!isVulnerable) {
            if (params.ras === 'wt' && params.location === 'left') {
              html += `<div class="subsection-title">★ RAS野生型 + 左側原発：抗EGFR抗体薬の優先を考慮</div>`
              data.unresectable.first_line.fit_ras_wt_left.regimens.forEach(r => {
                html += renderRegimen(r, params)
              })
            } else if (params.ras === 'wt' && params.location === 'right') {
              html += `<div class="info-box">ℹ️ 右側原発 + RAS野生型では、抗EGFR薬の上乗せ効果が限定的な可能性があります。Doublet + BEVを優先考慮してください。</div>`
            }
            html += `<div class="subsection-title">${data.unresectable.first_line.fit_doublet_bev.label}</div>`
            data.unresectable.first_line.fit_doublet_bev.regimens.forEach(r => {
              html += renderRegimen(r, params)
            })
            html += `<div class="subsection-title">${data.unresectable.first_line.fit_triplet.label}</div>`
            data.unresectable.first_line.fit_triplet.regimens.forEach(r => {
              html += renderRegimen(r, params)
            })
          } else {
            html += `<div class="warning-box">⚠️ PS 2（Vulnerable）：OX/IRI併用の忍容性を慎重に評価してください。</div>`
            html += `<div class="subsection-title">${data.unresectable.first_line.vulnerable.label}</div>`
            data.unresectable.first_line.vulnerable.regimens.forEach(r => {
              html += renderRegimen(r, params)
            })
          }
        } else if (params.line === 'second_after_ox') {
          html += `<div class="section-title">${data.unresectable.second_line.after_ox.label}</div>`
          data.unresectable.second_line.after_ox.regimens.forEach(r => {
            html += renderRegimen(r, params)
          })
        } else if (params.line === 'second_after_iri') {
          html += `<div class="section-title">${data.unresectable.second_line.after_iri.label}</div>`
          data.unresectable.second_line.after_iri.regimens.forEach(r => {
            html += renderRegimen(r, params)
          })
        } else if (params.line === 'third_plus') {
          html += `<div class="section-title">${data.unresectable.third_line_plus.label}</div>`
          data.unresectable.third_line_plus.regimens.forEach(r => {
            html += renderRegimen(r, params)
          })
        }

        if (params.braf === 'mut' && params.line !== 'first') {
          html += `<div class="info-box">🔴 BRAF V600E変異型：ENCO+CET または ENCO+BINI+CET が推奨されます（二次治療以降）。</div>`
        }

        if (params.her2 === 'pos') {
          html += `<div class="info-box">💙 HER2陽性：三次治療以降でPertuzumab + Trastuzumab（PER+TRA）を考慮。</div>`
        }
      }

      html += `<div style="margin-top:20px; font-size:11px; color:#a0aec0; text-align:right;">
        出典：${data.source}「${data.version}」<br>
        不明な条件（RAS/BRAF/MSI等）は灰色表示されていますが候補として参考にしてください。
      </div>`

      document.getElementById('result-content').innerHTML = html
    }
  }, [])

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>大腸癌化学療法レジメン選択支援ツール v2</title>
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
          background: #f0f4f8;
          color: #1a202c;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        #disclaimer {
          background: #744210;
          color: #fff;
          text-align: center;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }
        header {
          background: linear-gradient(135deg, #1a365d 0%, #2a4a7f 100%);
          color: white;
          padding: 14px 24px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        header h1 { font-size: 18px; font-weight: bold; }
        header p { font-size: 11px; opacity: 0.75; margin-top: 3px; }
        .version-badge {
          background: rgba(255,255,255,0.2);
          color: white;
          font-size: 11px;
          font-weight: bold;
          padding: 3px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.4);
        }
        .main-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }
        #input-panel {
          width: 320px;
          min-width: 270px;
          background: white;
          border-right: 1px solid #e2e8f0;
          padding: 20px 18px;
          overflow-y: auto;
          flex-shrink: 0;
        }
        #input-panel h2 {
          font-size: 13px;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #3182ce;
        }
        .form-group { margin-bottom: 14px; }
        .form-group label {
          display: block;
          font-size: 12px;
          font-weight: bold;
          color: #4a5568;
          margin-bottom: 5px;
        }
        .form-group select {
          width: 100%;
          padding: 7px 10px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 13px;
          background: white;
          color: #1a202c;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          cursor: pointer;
        }
        .form-group select:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49,130,206,0.15);
        }

        /* ---- 治療歴セクション ---- */
        #treatment_history_section {
          display: none;
          background: #fffbeb;
          border: 1px solid #f6e05e;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 14px;
        }
        #treatment_history_section .history-title {
          font-size: 12px;
          font-weight: bold;
          color: #744210;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        #treatment_history_section .history-subtitle {
          font-size: 11px;
          color: #975a16;
          margin-bottom: 10px;
        }
        .drug-category {
          margin-bottom: 10px;
        }
        .drug-category-label {
          font-size: 11px;
          font-weight: bold;
          color: #4a5568;
          margin-bottom: 5px;
          padding-bottom: 3px;
          border-bottom: 1px solid #e2e8f0;
        }
        .drug-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .drug-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          background: white;
          border: 1px solid #cbd5e0;
          border-radius: 16px;
          padding: 3px 10px;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 11px;
          color: #2d3748;
          user-select: none;
        }
        .drug-chip:hover { border-color: #e53e3e; background: #fff5f5; }
        .drug-chip input[type="checkbox"] { display: none; }
        .drug-chip.checked {
          background: #fed7d7;
          border-color: #e53e3e;
          color: #742a2a;
          font-weight: bold;
        }

        .btn-search {
          width: 100%;
          padding: 10px;
          background: #3182ce;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.15s;
        }
        .btn-search:hover { background: #2b6cb0; }
        .btn-reset {
          width: 100%;
          padding: 8px;
          background: #e2e8f0;
          color: #4a5568;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.15s;
        }
        .btn-reset:hover { background: #cbd5e0; }
        #result-panel {
          flex: 1;
          padding: 20px 22px;
          overflow-y: auto;
        }
        #result-panel h2 {
          font-size: 14px;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 14px;
          padding-bottom: 8px;
          border-bottom: 2px solid #48bb78;
        }
        .result-empty {
          text-align: center;
          color: #a0aec0;
          font-size: 14px;
          margin-top: 60px;
        }
        .result-empty .icon { font-size: 48px; margin-bottom: 12px; }
        .section-title {
          font-size: 13px;
          font-weight: bold;
          color: #2c5282;
          background: #ebf8ff;
          border-left: 4px solid #3182ce;
          padding: 6px 10px;
          margin: 14px 0 8px;
          border-radius: 0 4px 4px 0;
        }
        .subsection-title {
          font-size: 12px;
          font-weight: bold;
          color: #276749;
          background: #f0fff4;
          border-left: 3px solid #48bb78;
          padding: 5px 9px;
          margin: 10px 0 6px;
          border-radius: 0 4px 4px 0;
        }
        .regimen-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: opacity 0.2s;
        }
        .regimen-name {
          font-size: 14px;
          font-weight: bold;
          color: #1a202c;
        }
        .regimen-grade {
          display: inline-block;
          font-size: 11px;
          font-weight: bold;
          padding: 2px 7px;
          border-radius: 12px;
          margin-right: 6px;
        }
        .grade-standard { background: #c6f6d5; color: #22543d; }
        .grade-conditional { background: #fefcbf; color: #744210; }
        .grade-msi { background: #e9d8fd; color: #44337a; }
        .grade-braf { background: #fed7d7; color: #742a2a; }
        .grade-her2 { background: #bee3f8; color: #1a365d; }
        .grade-ntrk { background: #feebc8; color: #7b341e; }
        .regimen-condition { font-size: 11px; color: #e53e3e; font-weight: bold; }
        .regimen-note { font-size: 11px; color: #718096; }
        .conflict-badge {
          background: #e53e3e;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 10px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .conflict-note {
          font-size: 11px;
          color: #c53030;
          background: #fff5f5;
          border-left: 3px solid #e53e3e;
          padding: 3px 8px;
          border-radius: 0 4px 4px 0;
          margin-top: 2px;
        }
        .history-summary-box {
          background: #fffff0;
          border: 1px solid #f6e05e;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #744210;
          line-height: 1.6;
        }
        .alert-box {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #742a2a;
        }
        .info-box {
          background: #ebf8ff;
          border: 1px solid #bee3f8;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #1a365d;
        }
        .warning-box {
          background: #fffff0;
          border: 1px solid #f6e05e;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #744210;
        }
        @media (max-width: 640px) {
          .main-layout { flex-direction: column; overflow: visible; }
          #input-panel { width: 100%; min-width: unset; border-right: none; border-bottom: 1px solid #e2e8f0; }
        }
      `}</style>

      <div id="disclaimer">
        ⚠️ 本ツールは参照用です。最終的な治療判断は担当医が行ってください
      </div>

      <header>
        <div>
          <h1>大腸癌化学療法レジメン選択支援ツール</h1>
          <p>大腸癌治療ガイドライン 2024年版（JSCCR）に基づく</p>
        </div>
        <span className="version-badge">v2.0</span>
      </header>

      <div className="main-layout">
        <div id="input-panel">
          <h2>患者情報入力</h2>

          <div className="form-group">
            <label>病期（Stage）</label>
            <select id="stage">
              <option value="">-- 選択してください --</option>
              <option value="I">Stage I</option>
              <option value="II">Stage II</option>
              <option value="III">Stage III</option>
              <option value="IV_resectable">Stage IV（切除可能）</option>
              <option value="IV_unresectable">Stage IV（切除不能）</option>
              <option value="recurrent">再発</option>
            </select>
          </div>

          <div className="form-group" id="high_risk_group" style={{ display: 'none' }}>
            <label>再発リスク（Stage II の場合）</label>
            <select id="high_risk">
              <option value="low">低リスク</option>
              <option value="high">高リスク（T4, 穿孔, 閉塞, 低分化, 脈管浸潤, 検索リンパ節12個未満など）</option>
            </select>
          </div>

          <div className="form-group">
            <label>治療ライン</label>
            <select id="treatment_line">
              <option value="">-- 選択してください --</option>
              <option value="adjuvant">術後補助化学療法</option>
              <option value="first">一次治療</option>
              <option value="second_after_ox">二次治療（OX不応・不耐後）</option>
              <option value="second_after_iri">二次治療（IRI不応・不耐後）</option>
              <option value="third_plus">三次治療以降</option>
            </select>
          </div>

          {/* 治療歴入力セクション（2nd line以降で表示） */}
          <div id="treatment_history_section">
            <div className="history-title">
              📋 これまでの治療歴
            </div>
            <div className="history-subtitle">使用済みの薬剤にチェックしてください（重複レジメンを自動表示）</div>

            <div className="drug-category">
              <div className="drug-category-label">細胞毒性薬</div>
              <div className="drug-checkboxes">
                {[
                  { value: 'oxaliplatin', label: 'OX（オキサリプラチン）' },
                  { value: 'irinotecan', label: 'IRI（イリノテカン）' },
                  { value: 'fluorouracil', label: '5-FU系' },
                ].map(drug => (
                  <label key={drug.value} className="drug-chip" onClick={(e) => {
                    const chip = e.currentTarget
                    const cb = chip.querySelector('input')
                    cb.checked = !cb.checked
                    chip.classList.toggle('checked', cb.checked)
                  }}>
                    <input type="checkbox" className="prev-drug-check" value={drug.value} />
                    {drug.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="drug-category">
              <div className="drug-category-label">分子標的薬（血管新生阻害）</div>
              <div className="drug-checkboxes">
                {[
                  { value: 'bevacizumab', label: 'BEV（ベバシズマブ）' },
                  { value: 'ramucirumab', label: 'RAM（ラムシルマブ）' },
                ].map(drug => (
                  <label key={drug.value} className="drug-chip" onClick={(e) => {
                    const chip = e.currentTarget
                    const cb = chip.querySelector('input')
                    cb.checked = !cb.checked
                    chip.classList.toggle('checked', cb.checked)
                  }}>
                    <input type="checkbox" className="prev-drug-check" value={drug.value} />
                    {drug.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="drug-category">
              <div className="drug-category-label">分子標的薬（抗EGFR）</div>
              <div className="drug-checkboxes">
                {[
                  { value: 'cetuximab', label: 'CET（セツキシマブ）' },
                  { value: 'panitumumab', label: 'PANI（パニツムマブ）' },
                ].map(drug => (
                  <label key={drug.value} className="drug-chip" onClick={(e) => {
                    const chip = e.currentTarget
                    const cb = chip.querySelector('input')
                    cb.checked = !cb.checked
                    chip.classList.toggle('checked', cb.checked)
                  }}>
                    <input type="checkbox" className="prev-drug-check" value={drug.value} />
                    {drug.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="drug-category">
              <div className="drug-category-label">免疫チェックポイント阻害薬</div>
              <div className="drug-checkboxes">
                {[
                  { value: 'pembrolizumab', label: 'PEMBRO' },
                  { value: 'nivolumab', label: 'NIVO' },
                  { value: 'ipilimumab', label: 'IPI' },
                ].map(drug => (
                  <label key={drug.value} className="drug-chip" onClick={(e) => {
                    const chip = e.currentTarget
                    const cb = chip.querySelector('input')
                    cb.checked = !cb.checked
                    chip.classList.toggle('checked', cb.checked)
                  }}>
                    <input type="checkbox" className="prev-drug-check" value={drug.value} />
                    {drug.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="drug-category">
              <div className="drug-category-label">その他</div>
              <div className="drug-checkboxes">
                {[
                  { value: 'regorafenib', label: 'レゴラフェニブ' },
                  { value: 'trifluridine', label: 'TAS-102' },
                  { value: 'encorafenib', label: 'エンコラフェニブ' },
                  { value: 'binimetinib', label: 'ビニメチニブ' },
                ].map(drug => (
                  <label key={drug.value} className="drug-chip" onClick={(e) => {
                    const chip = e.currentTarget
                    const cb = chip.querySelector('input')
                    cb.checked = !cb.checked
                    chip.classList.toggle('checked', cb.checked)
                  }}>
                    <input type="checkbox" className="prev-drug-check" value={drug.value} />
                    {drug.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>PS（Performance Status）</label>
            <select id="ps">
              <option value="">-- 選択してください --</option>
              <option value="0">PS 0（制限なし）</option>
              <option value="1">PS 1（軽度制限あり）</option>
              <option value="2">PS 2（起居の50%以上）</option>
              <option value="3_4">PS 3-4（高度制限）</option>
            </select>
          </div>

          <div className="form-group">
            <label>RAS変異（KRAS/NRAS）</label>
            <select id="ras">
              <option value="">-- 未検査 / 不明 --</option>
              <option value="wt">野生型（Wild-type）</option>
              <option value="mut">変異型（Mutant）</option>
            </select>
          </div>

          <div className="form-group">
            <label>BRAF変異（V600E）</label>
            <select id="braf">
              <option value="">-- 未検査 / 不明 --</option>
              <option value="wt">野生型</option>
              <option value="mut">変異型（V600E）</option>
            </select>
          </div>

          <div className="form-group">
            <label>MSI / MMR状態</label>
            <select id="msi">
              <option value="">-- 未検査 / 不明 --</option>
              <option value="mss">MSS / pMMR</option>
              <option value="msi_h">MSI-H / dMMR</option>
              <option value="tmb_h">TMB-H（MSS/pMMRだがTMB高値）</option>
            </select>
          </div>

          <div className="form-group">
            <label>HER2状態</label>
            <select id="her2">
              <option value="">-- 未検査 / 不明 --</option>
              <option value="neg">陰性</option>
              <option value="pos">陽性（HER2陽性）</option>
            </select>
          </div>

          <div className="form-group">
            <label>原発巣部位</label>
            <select id="tumor_location">
              <option value="">-- 不明 --</option>
              <option value="left">左側（下行結腸・S状結腸・直腸）</option>
              <option value="right">右側（盲腸・上行結腸・横行結腸）</option>
            </select>
          </div>

          <button className="btn-search" onClick={() => window.search()}>レジメンを検索</button>
          <button className="btn-reset" onClick={() => window.resetForm()}>リセット</button>
        </div>

        <div id="result-panel">
          <h2>推奨レジメン</h2>
          <div id="result-content">
            <div className="result-empty">
              <div className="icon">💊</div>
              <span>患者情報を入力して「レジメンを検索」を</span><br /><span>クリックしてください</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
