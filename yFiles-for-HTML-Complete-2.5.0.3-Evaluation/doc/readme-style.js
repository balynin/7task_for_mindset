;(async function run() {
  const LARGE_WIDTH = 1350
  let sidebar = null
  const overlay = document.querySelector('div.overlay')
  function toggleSidebar() {
    if (sidebar && overlay) {
      sidebar.classList.toggle('collapsed')
      overlay.classList.toggle('collapsed')
    }
  }

  function hideSidebar() {
    if (sidebar && overlay) {
      sidebar.classList.add('collapsed')
      overlay.classList.add('collapsed')
    }
  }

  function showSidebar() {
    if (sidebar && overlay) {
      sidebar.classList.remove('collapsed')
      if (window.innerWidth < LARGE_WIDTH) {
        overlay.classList.remove('collapsed')
      } else {
        overlay.classList.add('collapsed')
      }
    }
  }

  window.addEventListener('resize', () => {
    shouldShowSidebar()
    shouldShowYFilesUiBanner()
  })

  function shouldShowSidebar() {
    if (window.innerWidth < LARGE_WIDTH) {
      hideSidebar()
    } else {
      showSidebar()
    }
  }

  function toggleExpandedContent(item) {
    item.parentNode.querySelectorAll('.expandable-item').forEach(child => {
      const content = child.querySelector('.expandable-item-content')
      const icon = child.querySelector('.expandable-item-icon')
      if (item === child) {
        content.classList.toggle('expanded')
        icon.classList.toggle('expanded')
      } else {
        content.classList.remove('expanded')
        icon.classList.remove('expanded')
      }
    })
  }

  document
    .querySelectorAll('.expandable-item')
    .forEach(item => item.addEventListener('click', () => toggleExpandedContent(item)))

  function initDarkMode() {
    const theme =
      localStorage.getItem('yfiles-readme-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'theme-dark' : 'theme-light')
    const body = document.querySelector('body')
    body.dataset.theme = theme || `theme-light`

    const darkModeToggle = document.getElementById('toggle-dark-mode')
    if (darkModeToggle) {
      darkModeToggle.checked = body.dataset.theme === 'theme-dark'
      darkModeToggle.addEventListener('change', toggleDarkMode)
    }
  }

  function toggleDarkMode() {
    const currentTheme =
      document.body.dataset.theme === 'theme-light' ? 'theme-dark' : 'theme-light'
    document.body.dataset.theme = currentTheme
    localStorage.setItem('yfiles-readme-theme', currentTheme)
  }

  function findRoot() {
    const cssElem = document.querySelector('link[href$="readme-style.css"]')
    const docRel = cssElem ? cssElem.getAttribute('href').replace(/^((?:\.\.\/)*).*$/, '$1') : ''
    return docRel.length ? `../${docRel}` : ''
  }

  function toggleBanner() {
    const yFilesUiBanner = document.querySelector('.yfiles-ui-banner')
    if (yFilesUiBanner) {
      const yFilesUiBannerIcon = yFilesUiBanner.querySelector('.header-icon')
      if (yFilesUiBannerIcon) {
        yFilesUiBanner.classList.toggle('collapsed')
        yFilesUiBannerIcon.classList.toggle('collapsed')
      }
    }
  }

  function shouldShowYFilesUiBanner() {
    const yFilesUiBanner = document.querySelector('.yfiles-ui-banner')
    if (!yFilesUiBanner) {
      return
    }
    const yFilesUiBannerIcon = yFilesUiBanner.querySelector('.header-icon')
    if (window.innerWidth - 400 < LARGE_WIDTH) {
      setTimeout(() => {
        if (!yFilesUiBanner.classList.contains('collapsed')) {
          yFilesUiBanner.classList.add('collapsed')
          yFilesUiBannerIcon.classList.add('collapsed')
        }
      }, 500)
    } else {
      if (yFilesUiBanner.classList.contains('collapsed')) {
        yFilesUiBanner.classList.remove('collapsed')
        yFilesUiBannerIcon.classList.remove('collapsed')
      }
    }
  }

  function getLink(root, url) {
    if (location.pathname.endsWith(url)) {
      return ''
    }
    return `${root}${url}`
  }

  function createSideBar(root) {
    const container = document.createElement('div')
    container.innerHTML = `<aside class="sidebar collapsed">
    <a class="home" href="${getLink(
      root,
      'README.html'
    )}"><span id="home" class="icon-home home-icon"></span><span>Home</span></a>
    <ul>
      <li class="section">Getting started
        <ul>
          <li><a href="${getLink(
            root,
            'doc/readme/first-time-setup.html'
          )}">First time setup</a></li>
          <li><a href="${getLink(root, 'doc/readme/learn-yfiles.html')}">Learn yFiles</a></li>
          <li><a href="${getLink(
            root,
            'doc/readme/your-own-yfiles-app.html'
          )}">Your own yFiles app</a></li>
        </ul>
      </li>
      <li class="section">Demos
        <ul>
          <li><a href="${getLink(
            root,
            'demos-ts/README.html'
          )}" target="_blank">Browse demos</a></li>
          <li><div data-yfiles-ui="sidebar-manage-demos-link"></div></li>
        </ul>
      </li>
      <li class="section">Documentation & help
        <ul>
          <li><a href="${getLink(
            root,
            'doc/api/index.html'
          )}" target="_blank">Documentation</a></li>
          <li><a href="${getLink(root, 'doc/readme/videos.html')}">yFiles videos</a></li>
          <li><a href="${getLink(root, 'doc/readme/support.html')}">yWorks support</a></li>
        </ul>
      </li>
      <li class="section">Returning developers
        <ul>
          <li><a href="${getLink(
            root,
            'doc/readme/changes.html'
          )}" target="_blank">Release notes</a></li>
          <li><a href="${getLink(
            root,
            'doc/api/index.html#/dguide/migration'
          )}" target="_blank">Migration guide</a></li>
        </ul>
      </li>
      <li class="section">License
        <ul>
          <li><a href="https://www.yworks.com/products/pricing" target="_blank">Pricing & order<span
            class="link-external icon-open-in-new"></span></a></li>
          <li><a href="${getLink(
            root,
            'doc/readme/license-info.html'
          )}">License & redistributables</a></li>
        </ul>
      </li>
    </ul>
  </aside>`
    return container.firstChild
  }

  function createHeader(title, simpleHeader, hideToggleSidebarButton) {
    const container = document.createElement('div')
    if (!title || !/\S/.test(title)) {
      //no proper title given
      title = 'Readme'
    }
    const classes = simpleHeader ? 'class="simple-header"' : ''
    const toggleButtonHtml =
      simpleHeader || hideToggleSidebarButton
        ? ''
        : '<span id="toggle-sidebar-button" class="icon-menu"></span>'
    const groupRight = simpleHeader
      ? ''
      : `
    <div class="header-group-right">
      <div class="status-bar-version">Version 2.5.0.3 Complete Evaluation</div>
      <label class="switch" title="Toggle Dark Mode"> <input type="checkbox" id="toggle-dark-mode"> <span class="slider"></span> </label>
      <div id="toggle-dark-mode-button" class="dark-mode-toggle"></div>
    </div>`

    container.innerHTML = `<header ${classes}>
      ${toggleButtonHtml}
      <div class="title">
        <span class="header-title">${title}</span>
        <a href="${getLink(root, 'README.html')}"><div class="logo"></div></a>
      </div>${groupRight}
    </header>
    `
    return container.firstChild
  }

  function createFooter() {
    const container = document.createElement('div')
    container.innerHTML = `<footer>
  <div class="footer-content"><div class="cards">
      <a class="card dark" href="https://www.yworks.com/products/app-generator" target="_blank">
        <div class="banner">For free!</div>
        <div class="logo-app-generator"></div>
        <div class="card-description">Create graph visualization prototypes – quickly!</div>
        <span class="link-text">https://www.yworks.com/app-generator</span>
      </a> <a class="card dark" href="https://www.yworks.com/products/yfiles/vsdx-export" target="_blank">
      <div class="logo-vsdx-export"></div>
      <div class="card-description">Easily export yFiles diagrams to VSDX file format (Microsoft Visio®).</div>
      <span class="link-text">https://www.yworks.com/products/yfiles/vsdx-export</span>
    </a>
    </div>
    <div class="visit-yworks">
      <div class="text">
        To learn more about our company and our other products, please visit our website: <a href="https://www.yworks.com"
        target="_blank">https://www.yworks.com</a>
      </div>
      <div class="logo"></div>
    </div></div>
</footer>`
    return container.firstChild
  }

  function createDetailedFooter() {
    const container = document.createElement('div')
    container.innerHTML = `<footer class="footer-detailed">
    <div class="footer-content">
    <div class="footer-block">
      <h4>Contact</h4>
      yWorks GmbH<br> Vor dem Kreuzberg 28<br> 72070 T&uuml;bingen<br> Germany<br> Phone: <a href="tel:+497071979050">+49
      7071 979050</a><br> Email: <a href="https://www.yworks.com/contact">contact(at)yworks.com</a>
    </div>
    <div class="footer-block">
      <h4>Follow Us</h4>
      <div class="social">
        <a href="https://www.yworks.com/products/yfiles-for-html" target="_blank" class="web">Homepage</a> <a href="https://www.yworks.com/newsfeed"
        target="_blank" class="rss">RSS Feed</a>
      </div>
      <div>
        <a href="https://github.com/yWorks" target="_blank" class="gh">GitHub</a> <a href="https://twitter.com/yworks"
        target="_blank" class="tw">Twitter</a> <a href="https://www.youtube.com/user/yWorksTube" target="_blank"
        class="yt">YouTube</a>
      </div>
      <br><br> <span class="copyright">COPYRIGHT &#x00A9; 2023 yWorks</span><br> <a
      href="https://www.yworks.com/company/legal/imprint">Legal Disclosure</a> | <a
      href="https://www.yworks.com/company/legal/terms-of-use">Terms of Use</a> | <a
      href="https://www.yworks.com/company/legal/privacy">Privacy Policy</a>
    </div>
    <div class="footer-block logo"></div>
    </div>
</footer>`
    return container.firstChild
  }

  function createYFilesUiBanner() {
    const container = document.createElement('div')
    container.innerHTML = `<div class="yfiles-ui-banner">
      <div class="header" id="toggle-yfiles-ui-banner">
        <span class="icon-collapse-banner header-icon"></span>
        <div class="header-content">Use the yFiles Dev Suite</div>
      </div>
      <div class="content collapsed">
        <div class="yfiles-ui-running" style="display: none">
          <span>yFiles Dev Suite is running</span>
          <a href="http://localhost:4343">Go to yFiles Dev Suite</a>
        </div>
        <div class="yfiles-ui-not-running" style="display: none">
          <span>Welcome back!</span>
          <p>yFiles Dev Suite is not running.</p> <span><b>Start</b> it in <b>your terminal</b> with </span><code>&gt; yfiles-dev-suite</code>
        </div>
        <div class="yfiles-ui-not-installed" style="display: none">
          <div>The yFiles Dev Suite makes it easy for you to get started and work with yFiles.</div>
<div><b>Start</b> it now:<pre>> npm i -g yfiles-dev-suite
> yfiles-dev-suite</pre></div>
          Features:
          <ul>
            <li>Easy Quick-start</li>
            <li>Request Support</li>
            <li>Manage Demos</li>
          </ul>
        </div>
      </div>
    </div>
`
    return container.firstChild
  }

  const root = findRoot()

  const readmeSideBar = document.getElementById('readme-sidebar')
  if (readmeSideBar) {
    sidebar = createSideBar(root)
    readmeSideBar.replaceWith(sidebar)
  } else {
    //other pages define the sidebar in their html file
    sidebar = document.querySelector('.sidebar')
  }

  const headerElement = document.getElementById('header')
  const simpleHeader = headerElement.classList.contains('simple-header')
  headerElement.replaceWith(
    createHeader(
      headerElement.innerHTML,
      simpleHeader,
      headerElement.classList.contains('hide-toggle-sidebar-button')
    )
  )

  const footerElement = document.getElementById('footer')
  if (footerElement) {
    footerElement.replaceWith(createFooter())
  }

  const detailedFooterElement = document.getElementById('footer-detailed')
  if (detailedFooterElement) {
    detailedFooterElement.replaceWith(createDetailedFooter())
  }

  const toggleSidebarBtn = document.getElementById('toggle-sidebar-button')
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', toggleSidebar)
  }

  const sidebarOverlay = document.getElementById('sidebar-overlay')
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', hideSidebar)
  }

  shouldShowSidebar()
  initDarkMode()

  function checkDemoServer() {
    const demoServerUrl = `http://localhost:4242/`
    fetch(demoServerUrl)
      .then(resp => {
        if (resp.headers.get('x-yfiles-for-html-demo-server')) {
          // demo server running -> "redirect" links to demos to demo server
          document.querySelectorAll('a').forEach(item => {
            const oldHref = item.href
            item.href = item.href.replace(/.*\/demos-(js|ts)\//i, `${demoServerUrl}demos-$1/`)
            if (oldHref !== item.href) {
              console.log(`Changed ${oldHref} -> ${item.href}`)
            }
          })
        } else {
          setTimeout(checkDemoServer, 1000)
        }
      })
      .catch(() => {
        setTimeout(checkDemoServer, 1000)
      })
  }

  async function isYFilesUIRunning() {
    const YFILES_UI_URL = `http://localhost:4343`
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(false)
      }, 1500)
      fetch(`${YFILES_UI_URL}/status`)
        .then(resp => {
          resolve(resp.ok)
        })
        .catch(() => {
          resolve(false)
        })
    })
  }

  async function initYFilesUI() {
    let uiRunning
    try {
      uiRunning = await isYFilesUIRunning()
    } catch (e) {
      uiRunning = false
    }
    if (uiRunning) {
      try {
        localStorage.setItem('yfiles-ui-installed', 'true')
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    if (location.host === 'localhost:4343') {
      // we are on yFiles Dev Suite already, don't show banner
      return
    }
    const yFilesUiBanner = document.getElementById('yfiles-ui-banner')
    if (yFilesUiBanner) {
      yFilesUiBanner.replaceWith(createYFilesUiBanner())
      const yFilesUiBannerHeader = document.getElementById('toggle-yfiles-ui-banner')
      yFilesUiBannerHeader.addEventListener('click', toggleBanner)
      shouldShowYFilesUiBanner()
      if (uiRunning) {
        const yFilesUIInfo = document.querySelector('.yfiles-ui-running')
        yFilesUIInfo.style.display = 'flex'
      } else if (localStorage.getItem('yfiles-ui-installed') === 'true') {
        const yFilesUIInfo = document.querySelector('.yfiles-ui-not-running')
        yFilesUIInfo.style.display = 'flex'
      } else {
        const yFilesUIInfo = document.querySelector('.yfiles-ui-not-installed')
        yFilesUIInfo.style.display = 'flex'
      }
    }
  }

  function shouldRedirect() {
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    const isFilesystem = location.protocol.includes('file')
    return isLocalhost || isFilesystem
  }

  if (shouldRedirect()) {
    await initYFilesUI()
    checkDemoServer()
  }
})().catch(e => {
  console.error(e)
})

function addClass(elementId, className) {
  const element = document.getElementById(elementId)
  if (element) {
    element.classList.add(className)
  }
}

function removeClass(elementId, className) {
  const element = document.getElementById(elementId)
  if (element) {
    element.classList.remove(className)
  }
}
