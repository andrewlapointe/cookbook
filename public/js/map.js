import { z } from "https://esm.sh/zod@3.22.4";

class MapsGraphicalOverlay extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.googleMapsAPIKey = "AIzaSyCTOxBhapsBWuIvhcn7sjXnWqOfPCTYsZQ";
    this.config;
    this.markersArray = [];
    this.availableFilters = [];
    this.map;
    this.dataLoader;
  }

  validateConfig(config) {
    const colorArray = z.array(z.string()).min(1);

    const filterSchema = z.object({
      chartColors: z.object({
        general: colorArray,
        pie: colorArray,
      }),
      svgIcon: z.string().url().optional(),
    });

    const configSchema = z.object({
      initialLocation: z.object({
        lat: z.number(),
        lng: z.number(),
        zoom: z.number(),
      }),

      dataFiles: z.array(z.string().url()).min(1),

      filters: z.object({
        evidence: filterSchema,
        antibiotic: filterSchema,
        mechanism: filterSchema,
      }),
    });

    const parsed = configSchema.safeParse(config);

    if (!parsed.success) {
      console.error("Config validation failed:", parsed.error);
      return false;
    }
    return true;
  }

  /**
   * @description Expand animation for chart container
   * @date 29/07/2025
   * @param {Node} menuContainer
   * @memberof MapsGraphicalOverlay
   */
  expandMenu(menuContainer) {
    menuContainer.querySelector("span.genome-counter").style.display = "inline";
    menuContainer.style.height = getComputedStyle(menuContainer).height;
    menuContainer.style.width = getComputedStyle(menuContainer).width;
    const parentHeight = menuContainer.parentElement.clientHeight;
    const allowedHeight = Math.floor(
      menuContainer.parentElement.clientHeight * 0.95
    );

    // TODO: take another pass at this sizing. Shouldn't have to set arbitrary pixel value
    const contentHeight =
      this.getAbsoluteHeight(menuContainer.querySelector("#chartContent")) +
      this.getAbsoluteHeight(menuContainer.querySelector("#menu-header")) +
      32;
    menuContainer.style.transition = "width 0.4s ease";
    menuContainer.style.width = "480px";

    setTimeout(() => {
      requestAnimationFrame(() => {
        menuContainer.style.transition = "height 0.4s ease";
        menuContainer.style.height = `${Math.min(
          allowedHeight,
          contentHeight
        )}px`;
        menuContainer.classList.remove("collapsed");
      });
    }, 400);
  }

  /**
   * @description Collapse animation for chart container
   * @date 29/07/2025
   * @param {Node} menuContainer
   * @memberof MapsGraphicalOverlay
   */
  collapseMenu(menuContainer) {
    menuContainer.style.height = getComputedStyle(menuContainer).height;
    menuContainer.style.width = getComputedStyle(menuContainer).width;

    menuContainer.style.transition = "height 0.4s ease";
    menuContainer.style.height = "50px";

    // After height animation finishes, transition width
    setTimeout(() => {
      menuContainer.style.transition = "width 0.4s ease";
      void menuContainer.offsetWidth;
      menuContainer.style.width = "180px";
      menuContainer.classList.add("collapsed");
      menuContainer.querySelector("span.genome-counter").style.display = "none";
    }, 400);
  }

  /**
   * @description Handles opening and closing of filter menu sections.
   * @date 29/07/2025
   * @param {Node} section
   * @memberof MapsGraphicalOverlay
   */
  openMenu(section) {
    const setDropdownHeight = (menuContent, sectionContainer) => {
      const sectionCount = Object.keys(this.config.filters).length + 1; // Add a section to account for the clear filters button
      const smallContainerHeight = this.getAbsoluteHeight(sectionContainer);
      const menuHeight = parseInt(menuContent.style.maxHeight);

      const calcHeight = menuHeight - smallContainerHeight * sectionCount;

      const sectionHeader = sectionContainer.querySelector(
        ".menu-section-header"
      );
      const headerHeight = this.getAbsoluteHeight(sectionHeader);
      const sectionSearch = sectionContainer.querySelector(
        ".menu-section-search"
      );
      const searchHeight = this.getAbsoluteHeight(sectionSearch);
      const sectionScroll = sectionContainer.querySelector(".menu-sub-section");

      sectionContainer.style.height =
        Math.min(sectionContainer.scrollHeight, calcHeight) + "px";

      sectionScroll.style.maxHeight = `${
        parseInt(sectionContainer.style.height) - headerHeight - searchHeight
      }px`;
    };
    // TODO: Change to querySelector definitions to make less brittle
    const sectionContainer = section.parentElement;
    const menuContent = sectionContainer.parentElement;
    const filterMenu = menuContent.parentElement;
    if (!sectionContainer.classList.contains("menu-opened")) {
      const calcContentHeight = () => {
        menuContent.style.maxHeight = `${
          filterMenu.offsetHeight -
          this.getAbsoluteHeight(filterMenu.querySelector("div#menu-header"))
        }px`;
      };
      calcContentHeight();
      setDropdownHeight(menuContent, sectionContainer);
    } else {
      requestAnimationFrame(() => {
        sectionContainer.style.height = "44px";
      });
    }
  }

  clearMapMarkers() {
    this.markersArray.map((marker) => marker.setMap(null));
    this.markersArray.length = 0;
  }

  /**
   * @description Returns the height of a dom element including padding, margin, and boarder
   * @date 29/07/2025
   * @param {Node} el
   * @return {Number}
   * @memberof MapsGraphicalOverlay
   */
  getAbsoluteHeight(el) {
    let styles = window.getComputedStyle(el);
    let margin =
      parseFloat(styles["marginTop"]) + parseFloat(styles["marginBottom"]);

    return Math.ceil(el.offsetHeight + margin);
  }

  /**
   * @date 23/07/2025
   * @param {LocationData} locationObj
   * @return {google.maps.marker.AdvancedMarkerElement}
   * @memberof MapsGraphicalOverlay
   */
  createPin(locationObj) {
    const position = locationObj.getCoordinates();
    // Check for NaN
    if (position.lat === position.lat && position.lng === position.lng) {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: position,
        gmpClickable: true,
        content: this.createPieChart(locationObj),
      });
      marker.addListener("gmp-click", () => {
        this.createCharts(locationObj);

        this.expandMenu(this.shadow.getElementById("charts"));
        this.map.panTo(marker.position);
      });

      const checkZoom = (firstCall = false) => {
        if (firstCall || this.markersArray.includes(marker)) {
          const zoom = this.map.getZoom();

          if (zoom < 4) {
            marker.map = locationObj.isStateLevel ? null : this.map;
          } else {
            marker.map = locationObj.isStateLevel ? this.map : null;
          }
        }
      };

      if (locationObj.isStateLevel || locationObj.country == "USA") {
        checkZoom(true);
        this.map.addListener("zoom_changed", () => {
          checkZoom();
        });
      }

      return marker;
    }
    return false;
  }

  createPieChart(locationObj) {
    const size = 80; // px
    const topN = 5;
    const includeOther = false;

    const ringGeom = [
      { cutout: "60%", radius: "80%" }, // outer
      { cutout: "40%", radius: "60%" }, // middle
      { cutout: "20%", radius: "35%" }, // inner
    ];
    // --------------------------------------

    // Container
    const chartContainer = document.createElement("div");
    chartContainer.style.position = "relative";
    chartContainer.style.width = `${size}px`;
    chartContainer.style.height = `${size}px`;
    chartContainer.style.overflow = "visible";

    const mkCanvas = (z) => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      c.style.position = "absolute";
      c.style.left = "0";
      c.style.top = "0";
      c.style.width = `${size}px`;
      c.style.height = `${size}px`;
      c.style.zIndex = String(z);
      c.style.pointerEvents = "none";
      return c;
    };
    const canvases = [mkCanvas(1), mkCanvas(2), mkCanvas(3)];
    canvases.forEach((c) => chartContainer.appendChild(c));

    const rings = locationObj.filterCategories.map((dim, i) => {
      const title = toTitleCase(dim);
      const { labels, counts } = locationObj.getTopNDatasetForDimension(
        dim,
        topN,
        includeOther
      );
      const palette = this.config.filters[dim].chartColors.pie;
      const backgroundColor = labels.map(
        (_, idx) => palette[idx % palette.length]
      );
      return {
        title,
        labels,
        counts,
        backgroundColor,
        cutout: ringGeom[i].cutout,
        radius: ringGeom[i].radius,
      };
    });

    const charts = rings.map((ring, i) => {
      const ctx = canvases[i].getContext("2d");
      return new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ring.labels,
          datasets: [
            {
              label: ring.title,
              data: ring.counts,
              backgroundColor: ring.backgroundColor,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: false,
          animation: false,
          events: [], // charts don't handle events. overlay will
          cutout: ring.cutout,
          radius: ring.radius,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
        },
      });
    });

    // Shared tooltip element
    const ensureTooltip = () => {
      let el = this.shadow.getElementById("chartjs-tooltip");
      if (!el) {
        el = document.createElement("div");
        el.id = "chartjs-tooltip";
        el.style.position = "absolute";
        el.style.pointerEvents = "none";
        el.style.opacity = "0";
        el.innerHTML = "<table></table>";
        this.shadow.appendChild(el);
      }
      return el;
    };
    const tooltipEl = ensureTooltip();

    // Overlay to capture mouse (top-most)
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.width = `${size}px`;
    overlay.style.height = `${size}px`;
    overlay.style.zIndex = "999";
    overlay.style.pointerEvents = "auto";
    chartContainer.appendChild(overlay);

    // Helpers: figure out ring under cursor (by radius), then show all segments for that ring
    const getCenter = () => {
      // any canvas is fine (same size)
      const rect = canvases[0].getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        rect,
      };
    };

    // Extract pixel radii from chart
    const getRingRadii = (chart) => {
      const meta = chart.getDatasetMeta(0);
      // pick any arc element
      const el = meta?.data?.[0];
      if (!el) return null;
      return { inner: el.innerRadius, outer: el.outerRadius };
    };

    const showTooltipForRing = (ringIndex, clientX, clientY) => {
      const ring = rings[ringIndex];
      if (!ring) return;

      // Build table for ALL segments in ring
      let rowsHtml = "";
      for (let i = 0; i < ring.labels.length; i++) {
        const color = ring.backgroundColor[i];
        const bullet = `<span class="tooltip-bullet" style="color:${color}">•</span>`;
        const label = ring.labels[i];
        const value = ring.counts[i];
        rowsHtml += `<tr><td>${bullet} <strong>${label}</strong>: ${value}</td></tr>`;
      }

      const html = `
      <thead><tr><th>${ring.title}</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    `;
      tooltipEl.querySelector("table").innerHTML = html;

      tooltipEl.style.opacity = "1";
      tooltipEl.style.left = `${clientX + 8}px`;
      tooltipEl.style.top = `${clientY + 8}px`;
    };

    const hideTooltip = () => {
      tooltipEl.style.opacity = "0";
    };

    overlay.addEventListener("mousemove", (e) => {
      const { x: cx, y: cy } = getCenter();
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const r = Math.hypot(dx, dy);

      // find which ring the radius falls into (using actual chart-computed radii)
      // start from outermost so it "wins" if boundaries touch
      let activeRingIndex = -1;
      for (let i = charts.length - 1; i >= 0; i--) {
        const rr = getRingRadii(charts[i]);
        if (!rr) continue;
        if (r >= rr.inner && r <= rr.outer) {
          activeRingIndex = i;
          break;
        }
      }

      if (activeRingIndex === -1) {
        hideTooltip();
        return;
      }

      showTooltipForRing(activeRingIndex, e.clientX, e.clientY);
    });

    overlay.addEventListener("mouseleave", hideTooltip);
    overlay.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        overlay.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: t.clientX,
            clientY: t.clientY,
          })
        );
      },
      { passive: true }
    );
    overlay.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        overlay.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: t.clientX,
            clientY: t.clientY,
          })
        );
      },
      { passive: true }
    );
    overlay.addEventListener("touchend", hideTooltip);

    return chartContainer;
  }

  /**
   * @date 29/07/2025
   * @param {LocationData} locationObj
   * @param {number} [maxBars=10]
   * @memberof MapsGraphicalOverlay
   */
  createBarChart(locationObj, dimension, chartContainer, maxBars = 10) {
    let newChart = document.createElement("canvas");
    newChart.style.height = "400px";
    newChart.style.width = "400px";

    chartContainer.appendChild(newChart);
    chartContainer.style.display = "none";

    const { labels, datasets } = locationObj.getStackedBarDatasets({
      dimension: dimension,
      groupBy: "genus",
      sort: "none",
      palette: this.config.barColorGeneratorPalette,
    });

    const ctx = newChart.getContext("2d");
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets,
      },
      options: {
        animation: false,
        plugins: {
          legend: {
            display: false,
            labels: {
              generateLabels: function (chart) {
                // Generate labels without a colored box
                return chart.data.datasets.map((dataset, i) => ({
                  text: dataset.label,
                  fillStyle: "transparent", // Invisible box
                  strokeStyle: "transparent",
                  lineWidth: 0,
                  hidden: !chart.isDatasetVisible(i),
                  datasetIndex: i,
                }));
              },
            },
          },
        },
        responsive: true,
        scales: {
          y: {
            stacked: true,
            beginAtZero: true,
            title: { display: false, text: "Frequency" },
          },
          x: {
            stacked: true,
            title: { display: false, text: "Genomes" },
            ticks: {
              autoSkip: false,
              maxRotation: 90,
              minRotation: 90,
              // callback: function (value, index) {
              //   const label = labels[index];
              //   return label.length > 10
              //     ? label.slice(0, 10) + "…"
              //     : label;
              // },
            },
          },
        },
      },
    });
  }

  /**
   * @date 23/07/2025
   * @param {LocationData} locationObj
   * @memberof MapsGraphicalOverlay
   */
  createCharts(locationObj) {
    const name = locationObj.name;
    const chartContainer = this.shadow.getElementById("charts");

    chartContainer.querySelector(
      ".menu-title"
    ).innerHTML = `<span style="font-weight: 600;">${name}</span> <span class="genome-counter">- ${locationObj.genomeCount} Genomes</span>`;

    const chartBody = chartContainer.querySelector("#charts-body");
    const selectors = chartContainer.querySelector("#charts-selector");
    while (chartBody.firstChild) {
      chartBody.removeChild(chartBody.firstChild);
    }
    while (selectors.firstChild) {
      selectors.removeChild(selectors.firstChild);
    }

    const createChartSection = (sectionId) => {
      const sectionContainer = document.createElement("div");
      sectionContainer.classList.add("chartSection");
      sectionContainer.id = sectionId;
      sectionContainer.style.width = "400px";
      sectionContainer.style.height = "400px";
      sectionContainer.style.display = "none";
      chartBody.appendChild(sectionContainer);

      return sectionContainer;
    };

    let promises = [];
    for (let filter of Object.keys(this.config.filters)) {
      promises.push(
        new Promise((resolve, reject) => {
          const chartContainer = createChartSection(filter);
          this.createBarChart(locationObj, filter, chartContainer);
          let newButton = HTMLhelper.chartSelector(
            filter,
            this.config.filters[filter].chartColors.general[0]
          );

          selectors.insertAdjacentHTML("beforeend", newButton);
        })
      );
    }
    // Options tab
    // let svgOnly = true;
    // const optionsTab = HTMLhelper.chartSelector(
    //   "options",
    //   "inherit",
    //   `<svg
    //     xmlns="http://www.w3.org/2000/svg"
    //     height="24px"
    //     viewBox="0 -960 960 960"
    //     width="24px"
    //     fill="#1f1f1f"
    //   >
    //     <path d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z" />
    //   </svg> `,
    //   svgOnly
    // );
    // const optionsSection = createChartSection("options");
    // optionsSection.innerHTML = HTMLhelper.chartOptions();

    // selectors.insertAdjacentHTML("beforeend", optionsTab);
    Promise.all(promises);
    chartBody.firstChild.classList.add("active-chart");

    let buttons = selectors.querySelectorAll("button");
    let charts = chartBody.querySelectorAll("div.chartSection");
    buttons[0].classList.add("active-chart");
    buttons.forEach((btn) => {
      btn.addEventListener("click", function () {
        btn.classList.add("active-chart");
        buttons.forEach((otherBtn) => {
          if (otherBtn != btn) {
            otherBtn.classList.remove("active-chart");
          }
        });
        charts.forEach((chart) => {
          if (chart.id != btn.id) {
            chart.classList.remove("active-chart");
            return;
          }
          chart.classList.add("active-chart");
        });
      });
    });
  }
  /**
   * @description Creates object to organize LocationData objs. Key: name of pin location. Value: respective location object.
   * @date 23/07/2025
   * @param {String} key Name of map pin location
   * @param {*} data Value of row returned from DataLoader dataGenerator.
   * @param {{String: LocationData}} locations Dictionary of LocationData objects. Key is name of map location.
   * @param {String} mapLevel Either "stateProv", "country", or "global"
   * @memberof MapsGraphicalOverlay
   */
  createUpdateLocationObj(key, data, locations, mapLevel) {
    if (!key) return;
    if (locations[key]) {
      locations[key].updateLocationData(data);
    } else {
      locations[key] = new LocationData(data, Object.keys(this.config.filters));
      switch (mapLevel) {
        case "global":
          try {
            locations[key].setGlobalLevel();
          } catch (err) {
            console.error(err);
          }
          break;
        case "stateProv":
          try {
            locations[key].setStateLevel();
          } catch (err) {
            console.error(err);
          }
          break;
      }
    }
  }

  /**
   * @description Loads filters for creation of filter menu checkboxes
   * @date 29/07/2025
   * @param {*} newFilters
   * @memberof MapsGraphicalOverlay
   */
  generateFilters(newFilters) {
    for (let filterType of Object.keys(this.config.filters)) {
      this.availableFilters[filterType] ??= [];
      if (newFilters[filterType]) {
        this.availableFilters[filterType] = newFilters[filterType].unique || [];
      }
    }
  }

  generateMenu() {
    const menuContainer = this.shadow.getElementById("menu");
    let isChecked = (section, value) => {
      if (
        this.dataLoader.getActiveFilters()[section] &&
        this.dataLoader.getActiveFilters()[section].has(value)
      ) {
        return true;
      } else {
        return false;
      }
    };

    let filterSections = [];

    for (let section in this.availableFilters) {
      let htmlString = "";
      for (let i in this.availableFilters[section]) {
        let value = this.availableFilters[section][i];
        htmlString += HTMLhelper.filterRow(
          section,
          value,
          i,
          isChecked(section, value)
        );
      }
      filterSections.push({ name: section, string: htmlString });
    }
    const taxonObject = this.dataLoader.getTaxonomyObj();
    const firstSpecies = Object.values(Object.values(taxonObject)[0])[0]
      .values()
      .next().value;
    menuContainer.innerHTML = HTMLhelper.menuStructure(
      filterSections,
      firstSpecies,
      this.dataLoader.getTotalSpecies() - 1
    );

    const menuSearchFunction = function () {
      const filterContainer = this.parentNode;

      const searchTerm = this.value.toLowerCase();

      const checkboxes = filterContainer.querySelectorAll(".form-check");
      checkboxes.forEach((box) => {
        let labelElement = box.querySelector(".form-check-label");
        let labelText = labelElement.textContent.toLowerCase();
        let checkboxElement = box.querySelector(".form-check-input");
        if (!labelText.includes(searchTerm)) {
          labelElement.style.display = "none";
          checkboxElement.style.display = "none";
          box.style.height = "0px";
          box.style.minHeight = "0px";
          box.setAttribute("style", "display: none !important");
        } else {
          labelElement.style.display = "";
          checkboxElement.style.display = "";
          box.style.height = "";
          box.style.display = "";
        }
      });
    };

    menuContainer
      .querySelectorAll(".menu-section input")
      .forEach(function (section) {
        section.addEventListener("input", menuSearchFunction);
      });

    const totalFilterCounter = menuContainer.querySelector(
      "#total-filter-count"
    );

    menuContainer.querySelectorAll(".form-check-input").forEach((checkbox) => {
      checkbox.addEventListener("change", (event) => {
        let checkbox = event.currentTarget;
        let type = checkbox.getAttribute("filter-type");
        const menuHeader =
          checkbox.parentElement.parentElement.parentElement.querySelector(
            ".menu-section-header"
          );
        let sectionFilterCounter = menuHeader.querySelector(
          ".section-filter-count"
        );
        sectionFilterCounter.style.backgroundColor = hexToRgba(
          this.config.filters[type].chartColors.general[0],
          0.7
        );
        if (checkbox.checked) {
          this.dataLoader.addFilter(type, checkbox.value);
          totalFilterCounter.textContent =
            Number(totalFilterCounter.textContent) + 1;
          sectionFilterCounter.textContent =
            Number(sectionFilterCounter.textContent) + 1;
          sectionFilterCounter.classList.remove("hide");
        } else {
          this.dataLoader.removeFilter(type, this.value);
          totalFilterCounter.textContent =
            Number(totalFilterCounter.textContent) - 1;
          sectionFilterCounter.textContent =
            Number(sectionFilterCounter.textContent) - 1;
          if (Number(sectionFilterCounter.textContent) == 0) {
            sectionFilterCounter.classList.add("hide");
          }
        }

        this.reload();
      });
    });

    const sidebarContainer = menuContainer.querySelector(
      "div#sidebar-menu-group"
    );

    sidebarContainer
      .querySelector(".clear-btn")
      .addEventListener("click", () => {
        for (let filter of Object.keys(this.dataLoader.activeFilters)) {
          this.dataLoader.activeFilters[filter].clear();
        }
        totalFilterCounter.textContent = 0;
        sidebarContainer
          .querySelectorAll(".section-filter-count")
          .forEach((counter) => {
            counter.textContent = 0;
            counter.classList.add("hide");
          });
        sidebarContainer
          .querySelectorAll("input.form-check-input")
          .forEach((checkbox) => {
            checkbox.checked = false;
          });
        this.reload();
      });

    sidebarContainer
      .querySelector("#show-filters-button")
      .addEventListener("click", function () {
        sidebarContainer.classList.toggle("open");
        sidebarContainer
          .querySelector(".menu-content")
          .classList.toggle("invisible");
        sidebarContainer
          .querySelector(".clear-btn")
          .classList.toggle("invisible");
        sidebarContainer
          .querySelector("#taxonomySelectorMenuGroup")
          .classList.toggle("invisible");
        const totalFilterCounter = menuContainer.querySelector(
          "#total-filter-count"
        );
        if (sidebarContainer.classList.contains("open")) {
          totalFilterCounter.classList.add("hide");
        } else {
          if (totalFilterCounter.textContent != 0) {
            totalFilterCounter.classList.remove("hide");
          }
        }
        const button = menuContainer.querySelector("#show-filters-button");
        button.classList.toggle("filter-active");

        const topLine = button.querySelector("line.top");
        const bottomLine = button.querySelector("line.bottom");
        let translation =
          (bottomLine.getAttribute("y1") - topLine.getAttribute("y1")) / 2;
        if (button.classList.contains("filter-active")) {
          requestAnimationFrame(() => {
            topLine.setAttribute(
              "transform",
              `rotate(45) translate(0, ${translation})`
            );
            bottomLine.setAttribute(
              "transform",
              `rotate(-45) translate(0, -${translation})`
            );
            bottomLine.setAttribute("x1", "0");
            bottomLine.setAttribute("x2", "40");
          });
        } else {
          requestAnimationFrame(() => {
            topLine.setAttribute("transform", "rotate(0) translate(0, 0)");
            bottomLine.setAttribute("transform", "rotate(0) translate(0, 0)");
            bottomLine.setAttribute("x1", "15");
            bottomLine.setAttribute("x2", "25");
          });
        }
      });

    const chartContainer = this.shadow.getElementById("charts");

    chartContainer
      .querySelector("#charts-menu-chevron")
      .addEventListener("click", () => {
        if (chartContainer.classList.contains("collapsed")) {
          this.expandMenu(chartContainer);
        } else {
          this.collapseMenu(chartContainer);
        }
      });

    const sectionHeader = menuContainer.querySelectorAll(
      "div.menu-section-header"
    );

    sectionHeader.forEach((section) =>
      section.querySelector(".chevron").addEventListener("click", () => {
        sectionHeader.forEach((otherSection) => {
          if (
            section !== otherSection &&
            otherSection.parentElement.classList.contains("menu-opened")
          ) {
            this.openMenu(otherSection);
            otherSection.parentElement.classList.toggle("menu-opened");
            otherSection.classList.toggle("flip");
          }
        });
        this.openMenu(section);
        section.parentElement.classList.toggle("menu-opened");
        section.classList.toggle("flip");
      })
    );
  }

  /**
   * @description This function requires a Generator function to load data.
   * The generator produces data by rows, and it is loaded here.
   * @date 29/07/2025
   * @return {{ String: LocationData}}
   * @memberof MapsGraphicalOverlay
   */
  async loadData() {
    const locations = {};

    // Calls async generator function that will produce data
    // one line at a time. Data is organized by geographic location
    // so that there are no duplicate map markers

    for await (const value of this.dataLoader.dataGenerator()) {
      const data = Object.values(value)[0];
      // Handle state and country data
      if (data.stateProv) {
        // Country
        if (data.country) {
          let mapLevel = "country";
          this.createUpdateLocationObj(data.country, data, locations, mapLevel);
        }
        // State
        let mapLevel = "stateProv";
        this.createUpdateLocationObj(data.stateProv, data, locations, mapLevel);
      } else {
        // Country without state
        if (data.country) {
          let mapLevel = "country";
          this.createUpdateLocationObj(data.country, data, locations, mapLevel);
        } else {
          // Stateless
          let mapLevel = "country";
          this.createUpdateLocationObj("stateless", data, locations, mapLevel);
        }
      }

      // Global
      let mapLevel = "global";
      this.createUpdateLocationObj("global", data, locations, mapLevel);
    }

    return locations;
  }

  loadMap(locationObjs, reloadMenu) {
    let promises = [];
    // State
    for (let location of Object.values(locationObjs)) {
      if (location.country) {
        promises.push(
          new Promise((resolve, reject) => {
            try {
              const marker = this.createPin(location);
              if (marker) {
                this.markersArray.push(marker);
              }
              resolve();
            } catch (err) {
              console.error(`Error: ${err}`);
            }
          })
        );
      }
    }
    promises.push(
      new Promise((resolve, reject) => {
        this.createCharts(locationObjs.global);
        this.expandMenu(this.shadow.getElementById("charts"));
      })
    );
    if (reloadMenu) {
      promises.push(
        new Promise((resolve, reject) => {
          this.generateMenu();
          resolve();
        })
      );
    }
    Promise.all(promises);

    const openModalBtn = this.shadow.querySelector("#openTaxonModal");
    openModalBtn.addEventListener("click", (e) => {
      this.openModal();
    });

    this.map.addListener("click", () => {
      this.createCharts(locationObjs.global);
    });
  }

  async loadTaxonomyModal(taxonURL) {
    this.setAttribute("firstLoad", "");
    const mapWrap = this.shadow.querySelector(".map-wrap");
    const content = this.shadow.querySelector("#app-surface");
    const backdrop = this.shadow.querySelector(".backdrop");
    const modal = this.shadow.querySelector(".modal");
    const dialog = this.shadow.querySelector(".dialog");
    const modalBody = this.shadow.querySelector("#taxonomyModalBody");
    const headerMessage = modal.querySelector("#msgBanner");

    const response = await fetch(taxonURL);
    const taxonJSON = await response.json();
    modalBody.innerHTML = HTMLhelper.taxonomyModal(taxonJSON);

    const searchBoxHost = this.shadow.querySelector("#modal-search-box");
    const searchInput = this.shadow.querySelector("#taxonomy-search");
    const searchClear = this.shadow.querySelector("#taxonomy-search-clear");

    const leftRoot = this.shadow.querySelector("#available-taxonomy-tree");
    const rightTree = this.shadow.querySelector("#selected-tree");

    const QS = (root, sel) => root.querySelector(sel);
    const QSA = (root, sel) => Array.from(root.querySelectorAll(sel));

    const debounce = (fn, ms = 120) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms);
      };
    };

    const filterLeftTree = (raw) => {
      const q = (raw || "").trim().toLowerCase();
      const leftContainer = this.shadow.querySelector(
        "#available-taxonomy-tree"
      );
      if (!leftContainer) return;

      const rootUl = leftContainer.querySelector("ul.list-tree");
      if (!rootUl) return;

      const familyDetails = Array.from(
        rootUl.querySelectorAll(":scope > li > details")
      );

      if (!q) {
        familyDetails.forEach((fd) => {
          const famLi = fd.closest("li");
          famLi.style.display = "";
          Array.from(fd.querySelectorAll(":scope > ul > li")).forEach(
            (gl) => (gl.style.display = "")
          );
          Array.from(fd.querySelectorAll("li.leaf")).forEach(
            (spLi) => (spLi.style.display = "")
          );
          const genDetails = Array.from(
            fd.querySelectorAll(":scope > ul > li > details")
          );
          genDetails.forEach((gd) => {});
        });
        return;
      }

      familyDetails.forEach((fd) => {
        const famLi = fd.closest("li");
        const famCb = fd.querySelector(
          'summary input.taxon-checkbox[data-level="family"]'
        );
        const famName = (famCb?.dataset.family || "").toLowerCase();
        const familyMatchDirect = famName.includes(q);

        let familyHasVisible = false;

        const genusLis = Array.from(fd.querySelectorAll(":scope > ul > li"));
        genusLis.forEach((gl) => {
          const gd = gl.querySelector(":scope > details");
          const genCb = gd?.querySelector(
            'summary input.taxon-checkbox[data-level="genus"]'
          );
          const genName = (genCb?.dataset.genus || "").toLowerCase();
          const genusMatchDirect = genName.includes(q);

          let genusHasVisible = false;

          const speciesLis = Array.from(
            gd.querySelectorAll(":scope > ul > li.leaf")
          );
          speciesLis.forEach((spLi) => {
            const spLabel = spLi.querySelector("label");
            const spText = (spLabel?.textContent || "").toLowerCase();
            const speciesMatch = spText.includes(q);

            const showSpecies =
              speciesMatch || genusMatchDirect || familyMatchDirect;

            spLi.style.display = showSpecies ? "" : "none";
            if (showSpecies) genusHasVisible = true;
          });

          const showGenus =
            genusMatchDirect || genusHasVisible || familyMatchDirect;
          gl.style.display = showGenus ? "" : "none";

          if (gd) gd.open = showGenus;

          if (genusMatchDirect || familyMatchDirect) {
            speciesLis.forEach((spLi) => (spLi.style.display = ""));
            genusHasVisible = true;
          }

          if (showGenus) familyHasVisible = true;
        });

        const showFamily = familyMatchDirect || familyHasVisible;
        famLi.style.display = showFamily ? "" : "none";

        fd.open = showFamily;
      });
    };

    // Wire the input & clear button
    const runFilter = debounce(() => filterLeftTree(searchInput.value), 120);
    searchInput.addEventListener("input", runFilter);
    // searchClear.addEventListener("click", () => {
    //   searchInput.value = "";
    //   filterLeftTree("");
    //   searchInput.focus();
    // });
    const slug = (s) =>
      String(s)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
    const mkId = (side, level, family, genus, species) =>
      `${side}-${level}-${[family, genus, species]
        .filter(Boolean)
        .map(slug)
        .join("__")}`;

    const selFor = (side, level, family, genus, species) => {
      const path = [
        `[data-level="${level}"]`,
        family ? `[data-family="${family}"]` : "",
        genus ? `[data-genus="${genus}"]` : "",
        species ? `[data-species="${species}"]` : "",
      ].join("");
      return `${
        side === "avail" ? "#available-taxonomy-tree" : "#selectedTaxonomies"
      } input.taxon-checkbox${path}`;
    };

    const stopToggle = (cbRoot) => {
      QSA(cbRoot, "input.taxon-checkbox").forEach((cb) =>
        cb.addEventListener("click", (e) => e.stopPropagation())
      );
    };

    const getSelectedCount = () => {
      return getSelectedSpecies().length;
    };

    const getSelectedSpecies = () => {
      const cbs = Array.from(
        this.shadow.querySelectorAll(
          '#selectedTaxonomies input.taxon-checkbox[data-level="species"]:checked'
        )
      );
      const uniq = new Map();
      for (const cb of cbs) {
        const key = `${cb.dataset.family}|${cb.dataset.genus}|${cb.dataset.species}`;
        if (!uniq.has(key)) {
          uniq.set(key, {
            family: cb.dataset.family,
            genus: cb.dataset.genus,
            species: cb.dataset.species,
          });
        }
      }
      return Array.from(uniq.values());
    };

    function ensureRightPath({ family, genus }) {
      let famDetails = QS(rightTree, `details[data-family="${family}"]`);
      if (!famDetails) {
        const li = document.createElement("li");
        famDetails = document.createElement("details");
        famDetails.dataset.family = family;
        famDetails.open = true;

        const summary = document.createElement("summary");
        const famId = mkId("sel", "family", family);
        summary.innerHTML = `
        <span class="tree-chevron" aria-hidden="true"></span>
        <input type="checkbox" class="taxon-checkbox" id="${famId}"
          data-level="family" data-family="${family}" data-label="${toTitleCase(
          family
        )}">
        <label for="${famId}">${toTitleCase(family)}</label>
        `;
        famDetails.appendChild(summary);
        famDetails.appendChild(document.createElement("ul"));
        li.appendChild(famDetails);
        rightTree.appendChild(li);
      }

      if (!genus) return famDetails;

      // ensure genus
      let genDetails = QS(famDetails, `details[data-genus="${genus}"]`);
      if (!genDetails) {
        const li = document.createElement("li");
        genDetails = document.createElement("details");
        genDetails.dataset.genus = genus;

        const summary = document.createElement("summary");
        const genId = mkId("sel", "genus", family, genus);
        summary.innerHTML = `
        <span class="tree-chevron" aria-hidden="true"></span>
        <input type="checkbox" class="taxon-checkbox" id="${genId}"
          data-level="genus" data-family="${family}" data-genus="${genus}" data-label="${toTitleCase(
          genus
        )}">
        <label for="${genId}">${toTitleCase(genus)}</label>
        `;
        genDetails.appendChild(summary);
        genDetails.appendChild(document.createElement("ul"));
        li.appendChild(genDetails);
        QS(famDetails, "ul").appendChild(li);
      }

      return genDetails;
    }

    function ensureRightLeaf({ family, genus, species }, checked) {
      const parent = ensureRightPath({ family, genus });
      const ul = QS(parent, "ul");
      let leaf = QS(ul, `li.leaf[data-species="${species}"]`);
      if (!leaf && checked) {
        leaf = document.createElement("li");
        leaf.classList.add("leaf");
        leaf.dataset.species = species;
        const id = mkId("sel", "species", family, genus, species);
        leaf.innerHTML = `
      <div>
        <input type="checkbox" class="taxon-checkbox" id="${id}"
          data-level="species" data-family="${family}" data-genus="${genus}" data-species="${species}" data-label="${toTitleCase(
          species
        )}" checked>
        <label for="${id}">${toTitleCase(species)}</label>
      </div>
    `;
        ul.appendChild(leaf);
      }
      return leaf;
    }

    function pruneEmptyAncestors(node) {
      let d = node?.closest("details");
      while (d) {
        // only prune inside the right selection tree
        const inRight = !!d.closest("#selectedTaxonomies");
        if (!inRight) break;

        const hasAnyLeaf = !!d.querySelector("li.leaf");
        const selfCb = d.querySelector("summary input.taxon-checkbox");
        const isChecked = !!selfCb?.checked;

        if (!hasAnyLeaf && !isChecked) {
          const li = d.closest("li");
          const parentDetails = li?.parentElement?.closest("details");
          li?.remove();
          d = parentDetails;
        } else {
          d = d.parentElement?.closest("details");
        }
      }
    }

    const updateParentCheckboxState = (detailsEl) => {
      if (!detailsEl) return;

      const parentCb = detailsEl.querySelector("summary input.taxon-checkbox");
      if (!parentCb) return;

      // reset
      parentCb.checked = false;
      parentCb.indeterminate = false;
      parentCb.disabled = false;

      const inRight = !!detailsEl.closest("#selectedTaxonomies");

      let total = 0;
      let checked = 0;

      if (inRight) {
        // RIGHT: leaves here == selected species; totals come from LEFT
        checked = detailsEl.querySelectorAll(
          'li.leaf input.taxon-checkbox[data-level="species"]'
        ).length;

        const fam = parentCb.dataset.family;
        const gen = parentCb.dataset.genus;
        const selector = gen
          ? `#available-taxonomy-tree input.taxon-checkbox[data-level="species"][data-family="${fam}"][data-genus="${gen}"]`
          : `#available-taxonomy-tree input.taxon-checkbox[data-level="species"][data-family="${fam}"]`;

        total = this.shadow.querySelectorAll(selector).length;
      } else {
        // LEFT: full subtree present
        const speciesBoxes = Array.from(
          detailsEl.querySelectorAll(
            'li.leaf input.taxon-checkbox[data-level="species"]'
          )
        );
        total = speciesBoxes.length;
        checked = speciesBoxes.filter((n) => n.checked).length;
      }

      if (total === 0) {
        parentCb.checked = false;
        parentCb.indeterminate = false;
        if (inRight) parentCb.disabled = true; // inert placeholder if it ever shows
        return;
      }

      if (checked === 0) {
        parentCb.checked = false;
        parentCb.indeterminate = false;
      } else if (checked === total) {
        parentCb.checked = true;
        parentCb.indeterminate = false;
      } else {
        // partial
        parentCb.checked = false;
        parentCb.indeterminate = true;
        if (inRight) parentCb.disabled = true; // grey + not clickable only on right
      }
    };

    function recomputeUpwardsFrom(node) {
      // walk up through nested <details> and recompute each parent
      let d = node ? node.closest("details") : null;
      while (d) {
        updateParentCheckboxState(d);
        d = d.parentElement?.closest("details");
      }
    }

    function recomputeSubtree(rootDetails) {
      if (!rootDetails) return;
      const all = Array.from(rootDetails.querySelectorAll("details"));
      all.forEach((d) => updateParentCheckboxState(d));
      updateParentCheckboxState(rootDetails);
    }

    function syncFromLeft(cb) {
      const level = cb.dataset.level;
      const family = cb.dataset.family || null;
      const genus = cb.dataset.genus || null;
      const species = cb.dataset.species || null;
      const checked = cb.checked;

      if (level === "species") {
        // mirror species only
        if (checked) {
          const leaf = ensureRightLeaf({ family, genus, species }, true);
          recomputeUpwardsFrom(leaf); // right-side parents
        } else {
          const rightLeaf = this.shadow
            .querySelector(
              `#selectedTaxonomies input.taxon-checkbox[data-level="species"][data-family="${family}"][data-genus="${genus}"][data-species="${species}"]`
            )
            ?.closest("li.leaf");
          if (rightLeaf) {
            const parent = rightLeaf.parentElement.closest("details");
            rightLeaf.remove();
            updateParentCheckboxState(parent);
            recomputeUpwardsFrom(parent);
            pruneEmptyAncestors(parent);
          }
        }
        // left-side parents
        recomputeUpwardsFrom(cb);
        return;
      }

      // genus or family
      const details = cb.closest("details");
      if (!details) return;

      // 1) Cascade LEFT (flip all descendants’ checkboxes)
      const descendants = Array.from(
        details.querySelectorAll("input.taxon-checkbox")
      ).filter((n) => n !== cb);
      descendants.forEach((d) => {
        d.checked = checked;
      });

      // 2) Mirror RIGHT for all species in this subtree
      const speciesNodes = Array.from(
        details.querySelectorAll('input.taxon-checkbox[data-level="species"]')
      );
      if (checked) {
        speciesNodes.forEach((sp) => {
          ensureRightLeaf(
            {
              family: sp.dataset.family,
              genus: sp.dataset.genus,
              species: sp.dataset.species,
            },
            true
          );
        });
      } else {
        speciesNodes.forEach((sp) => {
          const leaf = this.shadow
            .querySelector(
              `#selectedTaxonomies input.taxon-checkbox[data-level="species"][data-family="${sp.dataset.family}"][data-genus="${sp.dataset.genus}"][data-species="${sp.dataset.species}"]`
            )
            ?.closest("li.leaf");
          if (leaf) {
            const parent = leaf.parentElement.closest("details");
            leaf.remove();
            updateParentCheckboxState(parent);
            recomputeUpwardsFrom(parent);
          }
        });
      }

      if (!checked) {
        const rightGenDetails = genus
          ? this.shadow.querySelector(
              `#selectedTaxonomies details[data-genus="${genus}"]`
            )
          : null;
        const rightFamDetails = this.shadow.querySelector(
          `#selectedTaxonomies details[data-family="${family}"]`
        );

        if (rightGenDetails) pruneEmptyAncestors(rightGenDetails);
        if (rightFamDetails) pruneEmptyAncestors(rightFamDetails);
      }

      // 3) Recompute parent states on BOTH trees
      // left: make sure genus parents reflect their children (this was missing before)
      recomputeSubtree(details);
      recomputeUpwardsFrom(details);

      // right: update any existing family/genus containers
      const rightFam = this.shadow.querySelector(
        `#selectedTaxonomies details[data-family="${family}"]`
      );
      const rightGen = genus
        ? this.shadow.querySelector(
            `#selectedTaxonomies details[data-genus="${genus}"]`
          )
        : null;
      if (rightGen) {
        recomputeSubtree(rightGen);
        recomputeUpwardsFrom(rightGen);
      }
      if (rightFam) {
        recomputeSubtree(rightFam);
        recomputeUpwardsFrom(rightFam);
      }
    }
    function syncFromRight(cb) {
      // ignore greyed (disabled / indeterminate) parents on the right
      if (cb.disabled || cb.indeterminate) return;

      const level = cb.dataset.level;
      const family = cb.dataset.family || null;
      const genus = cb.dataset.genus || null;
      const species = cb.dataset.species || null;

      // Right is one-way: checking does nothing
      if (cb.checked) {
        cb.checked = false;
        return;
      }

      const li = cb.closest("li");

      // Uncheck matching LEFT subtree
      const baseSel =
        `#available-taxonomy-tree input.taxon-checkbox` +
        (family ? `[data-family="${family}"]` : "");
      const scopeSel =
        level === "family"
          ? baseSel
          : level === "genus"
          ? `${baseSel}[data-genus="${genus}"]`
          : `${baseSel}[data-genus="${genus}"][data-species="${species}"]`;
      this.shadow
        .querySelectorAll(scopeSel)
        .forEach((n) => (n.checked = false));

      // >>> Recompute LEFT parents immediately (so lingering indeterminate clears)
      const leftGenBox = genus
        ? this.shadow.querySelector(
            `#available-taxonomy-tree input.taxon-checkbox[data-level="genus"][data-family="${family}"][data-genus="${genus}"]`
          )
        : null;
      const leftFamBox = this.shadow.querySelector(
        `#available-taxonomy-tree input.taxon-checkbox[data-level="family"][data-family="${family}"]`
      );

      const leftGenDetails = leftGenBox && leftGenBox.closest("details");
      const leftFamDetails = leftFamBox && leftFamBox.closest("details");

      if (leftGenDetails) {
        recomputeSubtree(leftGenDetails);
        recomputeUpwardsFrom(leftGenDetails);
      }
      if (leftFamDetails) {
        recomputeSubtree(leftFamDetails);
        recomputeUpwardsFrom(leftFamDetails);
      }

      // Remove on RIGHT (leaf or entire subtree for parent)
      if (li && li.querySelector("details")) {
        const parentOfRemoved = li.parentElement.closest("details");
        li.remove();
        pruneEmptyAncestors(parentOfRemoved);
        if (parentOfRemoved) {
          recomputeSubtree(parentOfRemoved);
          recomputeUpwardsFrom(parentOfRemoved);
        }
      } else {
        const parentDetails = li?.parentElement?.closest("details");
        li?.remove();
        pruneEmptyAncestors(parentDetails);
        if (parentDetails) {
          recomputeSubtree(parentDetails);
          recomputeUpwardsFrom(parentDetails);
        }
      }
    }

    const clearAllSelections = () => {
      const leftRoot = this.shadow.querySelector("#available-taxonomy-tree");
      const rightTree = this.shadow.querySelector("#selected-tree");

      if (leftRoot) {
        leftRoot
          .querySelectorAll("input.taxon-checkbox:checked")
          .forEach((cb) => {
            cb.checked = false;
          });

        if (typeof recomputeSubtree === "function") {
          leftRoot
            .querySelectorAll("details")
            .forEach((d) => recomputeSubtree(d));
        } else if (typeof updateParentCheckboxState === "function") {
          leftRoot
            .querySelectorAll("details")
            .forEach((d) => updateParentCheckboxState(d));
        }
      }

      if (rightTree) {
        rightTree.innerHTML = "";
      }
    };

    stopToggle(leftRoot);
    stopToggle(this.shadow.querySelector("#selectedTaxonomies"));

    const closeBtn = modal.querySelector(".close");
    const form = this.shadow.querySelector("#dataForm");
    const clearBtn = modal.querySelector("#clearBtn");
    const loadBtn = modal.querySelector("#loadBtn");
    const modalBanner = modal.querySelector("#msgBanner");
    this.ui = {
      mapWrap,
      content,
      backdrop,
      modal,
      dialog,
      closeBtn,
      clearBtn,
      modalBanner,
    };

    // Wire: left → right
    QSA(leftRoot, "input.taxon-checkbox").forEach((cb) => {
      cb.addEventListener("change", () => {
        syncFromLeft.call(this, cb);
        updateMessage();
      });
    });

    // Wire: right → left
    this.shadow
      .querySelector("#selectedTaxonomies")
      .addEventListener("change", (e) => {
        const cb = e.target.closest("input.taxon-checkbox");
        if (!cb) return;
        syncFromRight.call(this, cb);
        updateMessage();
      });

    const updateMessage = () => {
      const warningThreshold = 20;
      const count = getSelectedCount();
      let messageText;

      if (count >= warningThreshold) {
        messageText = `You have selected ${count} genomes, which may result in long load time.`;
        this.ui.modalBanner.classList.add("warn");
      } else {
        messageText = `You have selected ${count} genomes.`;
        this.ui.modalBanner.classList.remove("warn");
      }
      this.ui.modalBanner.querySelector("p").textContent = messageText;
    };

    this.ui.closeBtn.style.visibility = "hidden";

    modal.querySelector("#available-taxonomy-tree").style.height =
      "fit-content";

    // Close on outside-click
    modal.addEventListener("click", (e) => {
      if (!this.hasAttribute("firstLoad")) {
        if (e.target === modal) this.closeModal();
      }
    });
    backdrop.addEventListener("click", () => {
      if (!this.hasAttribute("firstLoad")) {
        this.closeModal();
      }
    });
    closeBtn.addEventListener("click", () => {
      if (!this.hasAttribute("firstLoad")) {
        this.closeModal();
      }
    });
    clearBtn.addEventListener("click", () => {
      clearAllSelections();
      updateMessage();
    });

    this._onKeydown = (e) => {
      if (e.key === "Escape") {
        if (!this.hasAttribute("firstLoad")) {
          this.closeModal();
        }
      }
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const species = getSelectedSpecies();

      const postURL =
        form.getAttribute("action") || this.getAttribute("selection-post-url"); // TODO: should be moved to the config file

      if (postURL) {
        try {
          await fetch(postURL, {
            method: (form.getAttribute("method") || "POST").toUpperCase(),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ species }),
          });
        } catch (err) {
          console.error("Failed to POST species selection: ", err);
        }
      } else {
        console.warn("No Post URL provided.");
      }
      const locationObjs = await this.loadData();
      this.generateFilters(this.dataLoader.getAllFilters());
      this.loadMap(locationObjs, true);

      this.removeAttribute("firstLoad");
      this.ui.closeBtn.style.visibility = "visible";

      this.closeModal();
    });
    updateMessage();
  }

  openModal() {
    if (this.hasAttribute("open")) return;
    this.setAttribute("open", "");
    document.addEventListener("keydown", this._onKeydown);

    // Optional: inert + aria updates
    this.ui?.backdrop?.setAttribute("aria-hidden", "false");
    this.ui?.modal?.setAttribute("aria-hidden", "false");
    this.ui?.content?.setAttribute("inert", "");

    // Focus first focusable (don’t touch undefined this.ui)
    const first = this.shadowRoot.querySelector(
      ".dialog button, .dialog [href], .dialog input, .dialog select, .dialog textarea, .dialog [tabindex]:not([tabindex='-1'])"
    );
    if (first) first.focus();
  }

  closeModal() {
    if (!this.hasAttribute("open")) return;
    try {
      this.removeAttribute("open"); // TODO: this line throws an error;
    } catch (err) {
      console.error(err);
    }
    document.removeEventListener("keydown", this._onKeydown);

    // Optional: inert + aria updates
    this.ui?.content?.removeAttribute("inert");
    this.ui?.backdrop?.setAttribute("aria-hidden", "true");
    this.ui?.modal?.setAttribute("aria-hidden", "true");
  }

  reload() {
    this.clearMapMarkers();

    this.loadData()
      .then((locationObjs) => {
        this.loadMap(locationObjs);
      })
      .catch((err) => console.error("Failed to reload: ", err));
  }

  initMap() {
    const mapEl = this.shadow.querySelector("#map");
    this.map = new google.maps.Map(mapEl, {
      center: {
        lat: this.config.initialLocation.lat,
        lng: this.config.initialLocation.lng,
      },
      zoom: this.config.initialLocation.zoom,
      minZoom: 2,
      mapTypeId: "roadmap",
      streetViewControl: false,
      mapTypeControl: false,
      disableDefaultUI: true,
      mapId: "5680418226363c7bdd60ae50",
    });
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async connectedCallback() {
    try {
      // Build base HTML
      const template = document.createElement("template");
      const wrapper = document.createElement("div");
      wrapper.innerHTML = HTMLhelper.template();
      template.content.appendChild(wrapper);
      this.shadow.appendChild(template.content);

      const hostHeight = getComputedStyle(
        this.shadow.host.parentElement
      ).height;
      this.shadow.querySelector("#map").style.minHeight = hostHeight;
    } catch (err) {
      console.error("Error initializing HTML: ", err);
    }

    if (window.google?.maps) {
      this.initMap();
      return;
    }

    const configURL = this.getAttribute("config-url");
    if (!configURL) {
      console.error("Missing config-url attribute");
      return;
    }

    const taxonURL = this.getAttribute("taxonomy-info");
    if (!taxonURL) {
      console.error("missing taxonomy-info attribute");
      return;
    }

    try {
      const configRes = await fetch(configURL);
      if (!configRes.ok) {
        throw new Error(`Error loading config. Status: ${configRes.status}`);
      }
      const configData = await configRes.json();
      if (this.validateConfig(configData)) {
        this.config = configData;
      } else {
        throw new Error(`Invalid config structure.`);
      }

      this.dataLoader = new DataLoader(
        this.config.dataFiles,
        Object.keys(this.config.filters)
      );

      await Promise.all([
        this.loadScript(`https://cdn.jsdelivr.net/npm/chart.js`),
        this.loadScript(
          `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsAPIKey}&libraries=marker`
        ),
      ]);

      await this.loadTaxonomyModal(taxonURL);
      if (!this.hasAttribute("no-open-on-load")) this.openModal();
      this.initMap();
    } catch (err) {
      console.error("Map loading failed:", err);
    }
  }
}

// TODO: include coarse filters (country or species)
class DataLoader {
  /**
   * @date 15/07/2025
   * @param {[string]} dataUrls
   */
  constructor(dataUrls, filterCategories = []) {
    this.dataUrls = dataUrls;
    this.filterCategories = filterCategories;
    this.activeFilters = {};
    this.filters = {};
    this.meta = {
      general: {
        totalGenomeCount: 0,
        filteredGenomeCount: 0,
      },
      groups: {},
    };
    this.taxonomy = {};
    this.totalSpeciesCount = 0;
  }

  /**
   * @description Generator function. Fetches data file reader, loads data by chunks,
   * then yeilds data one row at a time. This removes the need to have all data rows loaded in memory.
   * @date 15/07/2025
   * @return {*}
   * @memberof dataLoader
   */
  async *dataGenerator() {
    const reset = () => {
      this.meta.general.totalGenomeCount = 0;
      this.meta.general.filteredGenomeCount = 0;
      this.meta.groups = {};
    };
    reset();
    let decoder = new TextDecoder("utf-8");
    let buffer = "";

    for (let url of this.dataUrls) {
      let stream;
      try {
        stream = await fetch(url);
        if (!stream.ok) {
          throw new Error(
            `Could not load data file ${url}. Status: ${stream.status}`
          );
        }
      } catch (err) {
        console.error(err);
        continue;
      }
      const reader = stream.body.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue; // skips empty lines
          try {
            const json = JSON.parse(line);
            const stepIn = Object.values(json)[0];
            this.meta.general.totalGenomeCount += 1;

            if (stepIn["family"]) {
              this.taxonomy[stepIn["family"]] ||= {};
              if (stepIn["genus"]) {
                this.taxonomy[stepIn["family"]][stepIn["genus"]] ||= new Set();
                if (stepIn["species"]) {
                  let thisGenus =
                    this.taxonomy[stepIn["family"]][stepIn["genus"]];
                  if (!thisGenus.has(stepIn["species"])) {
                    thisGenus.add(stepIn["species"]);
                    this.totalSpeciesCount++;
                  }
                }
              }
            }

            if (this.filterRow(json)) {
              this.meta.general.filteredGenomeCount += 1;
              this.updateMetadata(json);
              yield json;
            }
            continue;
          } catch (err) {
            console.error("Failed to parse JSONL line:", line, err);
          }
        }
      }
      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer);
          this.updateMetadata(json);
          yield json;
        } catch (err) {
          console.error("Failed to parse leftover JSONL line:", leftover, err);
        }
      }
    }
  }

  filterRow(row) {
    // AND filter. May switch to OR
    const data = Object.values(row)[0];

    if (Object.keys(this.activeFilters).length > 0) {
      for (let group of Object.keys(this.activeFilters)) {
        const filters = this.activeFilters[group];
        for (let filter of filters) {
          if (
            !data[group] ||
            data[group] === null ||
            !data[group].includes(filter)
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  updateMetadata(jsonObj) {
    this.meta.general.totalGenomeCount += 1;
    const data = Object.values(jsonObj)[0];
    for (let group of Object.keys(data)) {
      if (this.filterCategories.includes(group) && data[group]) {
        this.meta.groups[group] = this.meta.groups[group] || {
          count: 0,
          unique: [],
        };
        // this.meta.groups[group].count += data[group].length;
        this.meta.groups[group].unique = [
          ...new Set([...data[group], ...this.meta.groups[group].unique]), // list of unique values for filters
        ];
      }
    }
  }

  /**
   * @description Add additional active filter
   * @date 29/07/2025
   * @param {String} type Filter category
   * @param {String} value
   * @memberof DataLoader
   */
  addFilter(type, value) {
    try {
      this.activeFilters[type] ??= new Set();
      this.activeFilters[type].add(value);
    } catch (err) {
      console.error(`Error adding filter "${(type, value)}": ${err}`);
    }
  }

  removeFilter(type, value) {
    try {
      this.activeFilters[type].delete(value);
    } catch (err) {
      console.error(`Error removing filter "${(type, value)}": ${err}`);
    }
  }

  updateDataFiles(newUrlList) {
    this.dataUrls = newUrlList;
  }

  getTotalSpecies() {
    return this.totalSpeciesCount;
  }

  getTaxonomyObj() {
    return this.taxonomy;
  }

  getAllFilters() {
    return this.meta.groups;
  }
  getActiveFilters() {
    return this.activeFilters;
  }
}

class LocationData {
  constructor(dataObj, filterCategories) {
    this.country = dataObj.country || null;
    this.stateProv = dataObj.stateProv;
    this.isGlobalLevel = false;
    this.isStateLevel = false;
    this.isCountryLevel = true;
    this.name = this.country;
    this.genomeCount = 0;
    this.latitude;
    this.longitude;
    this.changeOnZoom = this.stateProv || this.country == "USA" ? true : false;
    this.filterCategories = filterCategories;
    this.index = {};

    for (let cat of this.filterCategories) {
      this.index[cat] = { species: new Map(), genus: new Map() };
    }

    this.groupsSeen = { species: new Set(), genus: new Set() };

    this.updateLocationData(dataObj);
    // this.#setStateProv();
    this.#setCoordinates();
  }

  #setCoordinates() {
    if (this.global) {
      this.latitude = 0;
      this.longitude = 0;
    } else if (this.stateProv && !this.isCountryLevel) {
      // Currently the lookup table only accommodates US states
      this.latitude =
        geoLookup["united states"]["states"][this.stateProv.toLowerCase()][
          "state_latitude"
        ];
      this.longitude =
        geoLookup["united states"]["states"][this.stateProv.toLowerCase()][
          "state_longitude"
        ];
    } else if (this.country && this.isCountryLevel) {
      // "United States" is hardcoded due to the BVBRC convention to
      // refer to the united states as "USA" rather than its
      // full name.
      const country =
        this.country.toLowerCase() == "usa"
          ? "united states"
          : this.country.toLowerCase();

      if (geoLookup[country]) {
        this.latitude = geoLookup[country]["country_latitude"];
        this.longitude = geoLookup[country]["country_longitude"];
      }
    } else {
      this.latitude = null;
      this.longitude = null;
    }
    // Ensure they are numbers
    this.latitude = Number(this.latitude);
    this.longitude = Number(this.longitude);
  }

  setStateLevel() {
    if (this.isGlobalLevel) {
      throw new Error("Cannot set both global and state level.");
    }
    this.isStateLevel = true;
    this.isCountryLevel = false;
    this.name = `${this.stateProv}, ${this.country}`;
    this.#setCoordinates();
  }

  setGlobalLevel() {
    if (this.isStateLevel) {
      throw new Error("Cannot set both global and state level.");
    }
    this.isGlobalLevel = true;
    this.isCountryLevel = false;
    this.name = "Global";
    this.latitude = null;
    this.longitude = null;
    this.stateProv = null;
    this.country = null;
  }

  /**
   * @description Update internal aggregates from one row of input data.
   * @param {{
   *   species?: string,
   *   genus?: string,
   *   family?: string,
   *   country?: string,
   *   stateProv?: string,
   *   year?: number|string,
   *   evidence?: string[],
   *   mechanism?: string[],
   *   antibiotic?: string[],
   * }} row
   */
  updateLocationData(row) {
    this.genomeCount += 1;

    for (let group of this.filterCategories) {
      const species = row.species ?? "Unknown species";
      const genus = row.genus ?? "Unknown genus";

      this.groupsSeen.species.add(species);
      this.groupsSeen.genus.add(genus);

      // Each of these arrays contributes counts to their respective dimension
      for (const dim of ["evidence", "mechanism", "antibiotic"]) {
        const arr = Array.isArray(row[dim]) ? row[dim] : [];
        if (arr.length === 0) continue;

        // Dedupe within a single row so accidental duplicates don’t double-count
        const uniqueLabels = new Set(arr.filter(Boolean));

        for (const label of uniqueLabels) {
          // Count toward species stacks
          this.#bump(this.index[dim].species, label, species);
          // Count toward genus stacks
          this.#bump(this.index[dim].genus, label, genus);
        }
      }
    }
  }

  /**
   * Private: increment count in Map(category -> Map(groupKey -> count))
   */
  #bump(rootMap, category, groupKey) {
    let catMap = rootMap.get(category);
    if (!catMap) {
      catMap = new Map();
      rootMap.set(category, catMap);
    }
    catMap.set(groupKey, (catMap.get(groupKey) ?? 0) + 1);
  }

  /**
   * Build Chart.js stacked-bar data for a given dimension and grouping.
   * - One bar per category label (e.g., each evidence value)
   * - Stacks are species or genus groups
   *
   * @param {Object} opts
   * @param {'evidence'|'mechanism'|'antibiotic'} opts.dimension
   * @param {'species'|'genus'} [opts.groupBy='species']
   * @param {'alpha'|'count'|'none'} [opts.sort='alpha']  Sort bars by label or by total count
   * @param {number} [opts.topN]  If provided, keep only the top N bars by total count
   * @returns {{ labels: string[], datasets: { label: string, data: number[] }[] }}
   */
  getStackedBarDatasets({
    dimension,
    groupBy = "species",
    sort = "alpha",
    palette = null,
    topN,
  } = {}) {
    const root = this.index[dimension]?.[groupBy];
    if (!root) return { labels: [], datasets: [] };

    // All category labels (bars)
    let labels = Array.from(root.keys());

    if (sort === "alpha") {
      labels.sort((a, b) => a.localeCompare(b));
    } else if (sort === "count") {
      const totals = new Map(labels.map((l) => [l, sumMap(root.get(l))]));
      labels.sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));
    }

    if (typeof topN === "number" && topN > 0) {
      labels = labels.slice(0, topN);
    }

    // Determine all group keys (stack series)
    const groupKeys = new Set(this.groupsSeen[groupBy]); // start with seen order
    for (const cat of labels) {
      for (const g of root.get(cat)?.keys() ?? []) {
        groupKeys.add(g);
      }
    }
    const colorGen = getBarColor(palette);
    const groups = Array.from(groupKeys);

    const datasets = groups.map((g) => ({
      label: g,
      data: labels.map((cat) => root.get(cat)?.get(g) ?? 0),
      backgroundColor: colorGen.next().value,
    }));

    return { labels, datasets };
  }

  /**
   * Convenience: return dataset payloads for all three dimensions.
   * @param {'species'|'genus'} groupBy
   */
  getAllStackedBarDatasets(groupBy = "species") {
    return {
      evidence: this.getStackedBarDatasets({ dimension: "evidence", groupBy }),
      mechanism: this.getStackedBarDatasets({
        dimension: "mechanism",
        groupBy,
      }),
      antibiotic: this.getStackedBarDatasets({
        dimension: "antibiotic",
        groupBy,
      }),
    };
  }

  /**
   * Get total counts per label for a dimension by summing across stacks.
   * Uses the 'species' index to sum (genus would give the same totals).
   * @param {'evidence'|'mechanism'|'antibiotic'} dimension
   * @returns {Map<string, number>} label -> total count
   */
  getTotalsByLabel(dimension) {
    const root = this.index[dimension]?.species; // Map(label -> Map(groupKey->count))
    const totals = new Map();
    if (!root) return totals;
    for (const [label, grpMap] of root.entries()) {
      let s = 0;
      for (const v of grpMap.values()) s += v;
      if (s > 0) totals.set(label, s);
    }
    return totals;
  }

  /**
   * Top-N labels + counts for one dimension, with optional "Other".
   * @param {'evidence'|'mechanism'|'antibiotic'} dimension
   * @param {number} topN
   * @param {boolean} includeOther
   * @returns {{ labels: string[], counts: number[] }}
   */
  getTopNDatasetForDimension(dimension, topN = 5, includeOther = true) {
    // Reuse the earlier helper you have (or implement inline)
    const totals = this.getTotalsByLabel(dimension); // Map<label,count>
    const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);

    const top = entries.slice(0, Math.max(0, topN));
    const labels = top.map(([l]) => l);
    const counts = top.map(([, c]) => c);

    if (includeOther && entries.length > top.length) {
      let other = 0;
      for (let i = top.length; i < entries.length; i++) other += entries[i][1];
      if (other > 0) {
        labels.push("Other");
        counts.push(other);
      }
    }
    return { labels, counts };
  }

  /**
   * Multi-ring doughnut data:
  
   * @param {Object} opts
   * @param {number} [opts.topN=5]
   * @param {boolean} [opts.includeOther=true]
   * @returns {{ labels: string[], datasets: { label: string, data: number[], labelsLocal: string[] }[] }}
   */
  getMultiRingDonutData({ topN = 5, includeOther = true } = {}) {
    const dims = this.filterCategories;

    const perDim = Object.fromEntries(
      dims.map((d) => [d, this.getTopN(d, topN, includeOther)])
    );

    const labelUnionSet = new Set();
    // Preserve readable ring-first ordering:
    for (const d of dims) {
      for (const l of perDim[d].labels) labelUnionSet.add(l);
    }
    const labels = Array.from(labelUnionSet);

    const datasets = dims.map((d) => {
      const { labels: localLabels, counts } = perDim[d];
      // Map local -> count for fast lookup
      const mapLocal = new Map(localLabels.map((l, i) => [l, counts[i]]));

      // data must align to global labels
      const data = labels.map((l) => mapLocal.get(l) ?? null);

      return {
        label: toTitleCase(d),
        data,
        customLabels: localLabels,
      };
    });

    return { labels, datasets };
  }

  getCoordinates() {
    return { lat: this.latitude, lng: this.longitude };
  }
}

class HTMLhelper {
  constructor() {}

  static styleSheets() {
    return /*html*/ `
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
      />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=vaccines" />
    `;
  }

  static styleTag() {
    const backgroundGrey = "#f8f9fa";
    return /*html*/ `
      <style>
        #map {
          min-height: 400px;
          width: 100%;
          height: 100% !important;
        }
        :host {
          display: block;
          width: 100%;
          height: 100% !important;
          min-height: 400px;
        }
        
        h1 {
          font-size: 1.4rem;
          margin-bottom: 0;
        }

        h2 {
          font-size: 1.1rem;
          font-weight: 450;
        }
        
        .map-wrap { position: relative; }
        
.backdrop {
  position: absolute;
  inset: 0;
  display: none;
  background: rgba(0,0,0,.08);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index: 9998;
}

.modal {
  position: absolute;
  inset: 0;
  display: none;
  z-index: 9999;
  place-items: center;
  pointer-events: none;
  overflow: hidden;
}

:host([open]) .backdrop,
:host([open]) .modal { 
  display: flex;
  justify-content: center;
  align-items: center;
 }

.modal {
  height: 100%;
}

.modal .dialog {
  pointer-events: auto;
  width: 760px;
  max-height: 70%;
  background: #fff;
  box-shadow: 0 16px 48px rgba(0,0,0,.24); /**TODO: make sure this is consistent with rest of shadows */
  padding: 24px 32px 32px 32px;
  display: grid;
  grid-template-rows: auto 1fr auto; /* header | body | footer */
  gap: 12px;
}

.modal .header {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
}
.modal .header .title-block {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal h1 {
  font-size: 32px;
}
.modal .title {
  font-weight: 600; 
}
.modal .close {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
}

.modal #msgBanner {

}

.modal #msgBanner p {
  color: green;
  margin-bottom: 0;
}
.modal #msgBanner.warn p {
  color: red;
}

#taxonomyModalBody {
  overflow: hidden;
  min-height: 0;
}

#taxonomyModalBody form > div:first-of-type {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0px;
  align-items: start;
  min-height: 0;
}
#taxonomyModalBody section {
  width: 100%;
  padding: 12px 0px 12px 20px;
  display: grid;
  grid-template-rows: auto auto 1fr; /* title | search/intro | scroll area */
  min-height: 0;
}
#taxonomyModalBody section:first-of-type {
  border-right: 1px solid #e3e6ea;
  padding: 12px 8px 12px 0px;

}
#taxonomyModalBody section h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
}
.taxonomy-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 6px;
}

#taxonomy-search {
  width: 75%;
  flex: 1 1 auto;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid #d8dde6;
  border-radius: 6px;
}

#taxonomy-search:focus {
  outline: none;
  border-color: #9bb4ff;
  box-shadow: 0 0 0 3px rgba(80, 120, 255, .15);
}

#taxonomy-search-clear {
  flex: 0 0 auto;
  border: none;
  background: #f0f2f6;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

#taxonomy-search-clear:hover {
  background: #e6e9ef;
}

#available-taxonomy-tree {
  overflow: auto;
  min-height: 0;
  max-height: calc(70vh - 160px);
}
#selectedTaxonomies > .scroll-container {
  overflow: auto;
  min-height: 0;
  max-height: calc(70vh - 160px);
}

.dialog > div:last-of-type {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

#clearBtn, #loadBtn, .close {
  font: inherit;
  line-height: 1;
  padding: 8px 12px;
  border-radius: 8px;
}
#clearBtn {
  border: 1px solid #ced4da;
  background: #fff;
}
#loadBtn {
  border: 1px solid #1f1f1f;
  background: #1f1f1f;
  color: #fff;
}
#loadBtn:hover { filter: brightness(1.1); }
#clearBtn:hover { background: #f3f4f6; }


        .list-tree,
        .list-tree ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .list-tree summary::marker,
        .list-tree summary::-webkit-details-marker {
          display: none;
        }

        .list-tree details > summary {
          display: flex;
          align-items: center;
          gap: .5rem;  /* space between chevron, checkbox, label */
          cursor: pointer;
          line-height: 1.25;
          padding: 4px 2px;
        }

        .list-tree summary .tree-chevron {
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          display: inline-block;
          transform: rotate(0deg);    /* open: point down */
          position: relative;
          transition: transform .15s ease;
        }
        .list-tree details[open] > summary .tree-chevron {
          transform: rotate(90deg);  /* closed: point to the right */
        }
        /* draw the chevron shape using borders */
        .list-tree summary .tree-chevron::before {
          content: "";
          position: absolute;
          inset: 0;
          border-right: 2px solid currentColor;
          border-bottom: 2px solid currentColor;
          transform: rotate(-45deg) translateY(-1px); /* visual tweak */
          transform-origin: center;
        }

        .list-tree > li > details > ul {     /* level 1 children (genus under family) */
          margin-top: 4px;
          margin-left: 6px;
          padding-left: 1.5rem;
          border-left: 1px solid #e6e9ee;
        }
        .list-tree > li > details > ul > li > details > ul {  /* level 2 children (species under genus) */
          margin-top: 2px;
          margin-left: 6px;

          padding-left: 2.25rem;
          border-left: 1px solid #eef1f5;
        }

        .list-tree li.leaf > div {
          display: flex;
          align-items: center;
          gap: .5rem;
          padding: 4px 2px;
        }

        .list-tree input.taxon-checkbox {
          margin: 0;
        }

        #selectedTaxonomies input.taxon-checkbox:indeterminate {
          accent-color: #b7bcca;
        }

        /* If you disable the input (we do when indeterminate), make it feel inert */
        #selectedTaxonomies input.taxon-checkbox:disabled {
          cursor: default;
          opacity: .65;
          pointer-events: none;
        }

        #selectedTaxonomies input.taxon-checkbox:disabled:hover {
          filter: none;
          box-shadow: 
        }
        
        #sidebar {
          background-color: ${backgroundGrey};
          box-shadow: 0 0 10px -3px rgba(0, 0, 0, 0.4);
          clip-path: inset(0 -15px 0 0);
        }
        #menu, #charts {
          position: absolute;
          transition: top 0.3s ease, height 0.3s ease;
          overflow: hidden;
          top: 0;
        }

        #menu {
          height: 100%;
        }

        #menu.menu-container {
          pointer-events: none;
        }

        #sidebar-menu-group {
          position: relative;
          right: 216px;
          transition: right 0.4s ease;
          pointer-events: auto;
        }
        #sidebar-menu-group.open {
          position: relative;
          right: 0px;
        }

        /* TODO: This should be a dynamic width */
        #charts {
          margin-top: 10px;
          margin-right: 10px;
          right: 0px;
          top: 0px;
          height: 50px;
          width: 180px
        }

        #chartContent {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding-right: 1rem;
          padding-left: 1rem;
          overflow: hidden;
        }
        #charts-body .chartSection {
          margin: auto;
        }
        
        #charts-body .chartSection.active-chart {
          display: block !important;
        }
        
        #charts-selector {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          width: 80%;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        #charts-selector button {
          color: white;
          padding: 0.2rem 0.5rem; 
          margin: 0rem 0.5rem;
          opacity: 35%;

        }
        #charts-selector .active-chart {
          opacity: 100%;
        }

        section#chart-options {
          width: 100%;
          margin-top: auto;
          margin-bottom: 0.25rem;
          padding-top: 0.5rem;
          justify-content: flex-start;
          align-self: flex-end;
          flex-grow: 1;
          h2 {
            font-size: 1.5rem;
          }
          div.chart-options-group {
            margin-left: 1rem;
            h3 {
              font-size: 1rem;
            }
            margin-bottom: 0.5rem;
            input {
              margin-left: 0.5rem;
            }
            label {
              margin-left: 0;
            }
          }
        }
        
        .menu-box .form-check {
          margin-left: 4px;
          width: 100%;
        }

        .menu-box {
          padding-bottom: 0;
          padding-top: 0;
          background-color: ${backgroundGrey};
          max-width: 270px;
          overflow: hidden;
        }

        #charts .menu-box {
          position: relative;
          padding: .7rem 1rem;
          max-width: 480px;
        }


        .menu-section > div.form-check:first-of-type {
          margin-top: 1rem;
        }

        .menu-box label {
          font-weight: 400;
          margin-left: 0.4rem;
        }

        .menu-box select {
          border-radius: 0.5rem;
        }
        

        #menu-header {
          width: 100%;
        }

        #filter-menu-container {
          display: flex;
          flex-direction: column;

          padding: 1rem;
          padding-bottom: 0;
        }

        .menu-title {
          font-size: 1.1rem;
          font-weight: 400;
          white-space: nowrap;  
          overflow: hidden;   
          max-width: 100%;    
        }
        .menu-title h1 {
          text-overflow: ellipsis;
        }

        .menu-content {
          max-height: 550px;
          visibility: visible;
          
          transition: ease 0.3s width;
        }

        
        .filter-menu-btn, .menu-section {
          border: 1px solid #dee2e6;
          background-color: white;
          width: 100%;          
        }
        .filter-menu-btn {
          text-align: center;
          border-radius: 0.375rem;
        }
        .filter-menu-btn:hover {
          filter: brightness(0.75)
        }
        
        .menu-section {
          margin-bottom: 0.4rem;
          padding-left: 1rem;
          padding-right: 1rem;
          padding-bottom: 1rem;
          height: 44px;
          overflow: hidden;
          transition: ease .4s height;
        }


        input.form-check-input {
          min-width: 16px;
          height: 16px;
        }

        .menu-section.clear-btn {
          font-weight: 500;
        }
        .clear-btn {
          margin-top: auto;
          padding: 0.5rem 1rem;
        }

        .menu-section.menu-opened {
        }
        .menu-section-header {
          font-weight: 600;
        }

        .menu-section-search {
          width: 100%
        }

        #taxonomySelectorMenuGroup {
          border-left: 1px black solid;
          padding-left: 0.5rem;
          margin-top: 0.5rem;
        }

        p#taxonomyHint {
          margin-bottom: 0.5rem;
        }

        .scroll-container {
          overflow: auto;
        }
        .scroll-container::-webkit-scrollbar-thumb {
          background-color: #adb5bd;
          border: 10px solid transparent;
          border-radius: .8rem;
          background-clip: padding-box;  
        }

        .scroll-container::-webkit-scrollbar {
          width: 24px;
        }

        .menu-sub-section {
          max-height: 300px;
        }

        #taxon-dropdown {
          margin: 0.5rem;
          background-color: ${backgroundGrey};
          padding: 0.5rem;
          transition: ease 0.4s height;
          
          #taxon-header {
            display: flex;
            flex-direction: row;
            justify-content: space-between;

          }
          
          #taxon-tree {
            margin-top: 0.5rem;
          }

        }

        .chevron {
          width: 1.2em;
          transition: transform .4s ease;
        }

        .chevron-button {
          background-color: rgba(0,0,0,0);
          border: none;
          cursor: pointer;
        }

        
        .flip .chevron {
          transform: scaleY(-1);
        }

        .sidebar-btn {
          border: none;
          background-color: inherit;
          padding: 0;
        }

        div#chartjs-tooltip {
          z-index: 4; 
          background-color: ${backgroundGrey};
          box-shadow: 0 0 10px -3px rgba(0, 0, 0, 0.4);
          padding: 0.7rem 1rem;
        }

        div#chartjs-tooltip td {
          display: flex;
          flex: row;
          align-items: center;
        }

        span.tooltip-bullet {
          padding-right: 0.5rem;
          font-size: 1.7rem;
        }

        svg line {
          stroke: black;
          stroke-width: 3;
          transition: all .4s ease;
          transform-origin: center center;
          transform-box: view-box;

        }

        .filter-active > .icon .middle {
          opacity: 0;
        }

        .filter-counter {
          width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-weight: 500;
        }
        .filter-counter.hide {
          display: none;
        }
        #total-filter-count {
          background-color: black;

          position: absolute;
          top: 9px;
          right: 5px;
        }

        .section-filter-count {
          height: 1.3rem;
          width: 1.3rem;
        }

      </style>
      `;
  }

  static menuHeader(title, id, filterCount = 0) {
    let button;
    let filterCounter;
    if (id === "filter") {
      button = /*html*/ `
        <button id="show-filters-button" class="sidebar-btn">
          <div class="icon" id="filterToggle">
          ${HTMLhelper.icons("filter")}
          
          </div>
        </button>
      `;
      filterCounter = /*html*/ `
          <div id="total-filter-count" class="filter-counter ${
            filterCount == 0 ? "hide" : ""
          }">
            ${filterCount}
          </div>
        `;
    } else {
      button = /*html*/ `
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
          <g transform="rotate(90, 480, -480)">
            <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/>
          </g>
        </svg>
      `;
    }
    return /*html*/ `
          <div
            id="menu-header"
            class="d-flex flex-row justify-content-between align-items-center mb-1"
          >
            <div class="menu-title mb-0"><h1>${title}</h1></div>
            <div class="d-flex justify-content-center align-items-center">
              ${filterCounter ? filterCounter : ""}

              
              <button
                id="${id}-menu-chevron"
                class="p-0 chevron-button justify-content-center align-items-center"
              >
                ${button}
              </button>
            </div>
          </div>
        `;
  }

  static template() {
    return /*html*/ `
      ${HTMLhelper.styleSheets()} ${HTMLhelper.styleTag()}
      <div class="h-100 border shadow map-wrap">

        <div class="backdrop" aria-hidden="true"></div>

        <form id="dataForm" class="" method="POST">
          <div class="modal" aria-hidden="true">
            <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
              <div class="header">
                <div class="title-block">
                  <h1 class="title" id="dlg-title">Genome Selection</h1>
                  <button class="close" type="button" aria-label="Close">✕</button>
                </div>          
                <div id="msgBanner" class="me-2">
                  <p></p>
                </div>
              </div>
              <div id="taxonomyModalBody"></div>
              <div class="footer">
                <button type="button" id="clearBtn">Clear All</button>
                <button type="submit" id="loadBtn">Display Selection</button>
              </div>
            </div>
          </div>
        </form>

       
        <div id="app-surface" class="d-flex flex-row w-100 h-100 position-relative">
          <div id="menu" class="menu-container center z-3">

          </div>
          <div id="charts" class="charts-container menu-container shadow collapsed collapsible z-2">
            <div class="menu-box h-100">
              ${HTMLhelper.menuHeader("Charts", "charts")}
              <div id="chartContent" class="">
                <div id="charts-selector"></div>
                <div id="charts-body">
                  ${HTMLhelper.chartOptions()}
                </div>
              </div>
            </div>
          </div>
          <div id="map" class="w-100"></div>
        </div>
         <section id="map-top-section" class="w-100"></section>
      </div>
      ${HTMLhelper.scriptTag()}
      `;
  }

  static scriptTag() {
    return /*html*/ `
        <script
            async
            src="https://cdn.jsdelivr.net/npm/es-module-shims@1/dist/es-module-shims.min.js"
            crossorigin="anonymous"
        ></script>
      `;
  }

  static filterRow(section, value, index, isChecked) {
    return /*html*/ `
      <div class="form-check d-flex flex-row justify-content-start w-100 text-break">
        <input class="form-check-input" filter-type=${section} value="${value}"
        type="checkbox" id="${section}-option-${index}" ${
      isChecked ? "checked" : ""
    } />
        <label class="form-check-label" for="${section}-option-${index}">${value}</label>
      </div>
          `;
  }

  static icons(key) {
    switch (key) {
      // TODO: Should be a config
      case "evidence":
        return /*html*/ `
          <svg

          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#1f1f1f"
          >
            <path d="M200-120v-80h200v-80q-83 0-141.5-58.5T200-480q0-61 33.5-111t90.5-73q8-34 35.5-55t62.5-21l-22-62 38-14-14-36 76-28 12 38 38-14 110 300-38 14 14 38-76 28-12-38-38 14-24-66q-15 14-34.5 21t-39.5 5q-22-2-41-13.5T338-582q-27 16-42.5 43T280-480q0 50 35 85t85 35h320v80H520v80h240v80H200Zm346-458 36-14-68-188-38 14 70 188Zm-126-22q17 0 28.5-11.5T460-640q0-17-11.5-28.5T420-680q-17 0-28.5 11.5T380-640q0 17 11.5 28.5T420-600Zm126 22Zm-126-62Zm0 0Z" />
          </svg>
        `;
      case "antibiotic":
        return /*html*/ `
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="m320-60-80-60v-160h-40q-33 0-56.5-23.5T120-360v-300q-17 0-28.5-11.5T80-700q0-17 11.5-28.5T120-740h120v-60h-20q-17 0-28.5-11.5T180-840q0-17 11.5-28.5T220-880h120q17 0 28.5 11.5T380-840q0 17-11.5 28.5T340-800h-20v60h120q17 0 28.5 11.5T480-700q0 17-11.5 28.5T440-660v300q0 33-23.5 56.5T360-280h-40v220Zm360-20q-66 0-113-47t-47-113v-320q0-66 47-113t113-47q66 0 113 47t47 113v320q0 66-47 113T680-80ZM200-360h160v-60h-70q-12 0-21-9t-9-21q0-12 9-21t21-9h70v-60h-70q-12 0-21-9t-9-21q0-12 9-21t21-9h70v-60H200v300Zm480-280q-33 0-56.5 23.5T600-560h160q0-33-23.5-56.5T680-640Zm-80 320h160v-160H600v160Zm80 160q33 0 56.5-23.5T760-240H600q0 33 23.5 56.5T680-160Zm0-400Zm0 320Z"/></svg>
        `;
      case "mechanism":
        return /*html*/ `
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M600-80q-17 0-28.5-11.5T560-120v-43q-23-4-43.5-11.5T478-195l-40 40q-12 11-28.5 11.5T381-155q-12-12-12-28.5t12-28.5l41-41q-3-5-6-10.5t-6-10.5l-27-53-49 49q-12 11-28 11.5T278-278q-12-12-12-28t12-28l49-50-53-26q-5-2-9-4.5t-9-5.5l-36 36q-12 11-28.5 11.5T163-384q-12-12-12-28t12-28l35-35q-14-19-22.5-40.5T163-560h-43q-17 0-28.5-11.5T80-600q0-17 11.5-28.5T120-640h45q5-19 12-36t18-33l-35-35q-12-12-12-28t12-28q12-12 28-12t28 12l35 35q16-11 33-18t36-12v-45q0-17 11.5-28.5T360-880q17 0 28.5 11.5T400-840v43q24 4 45.5 13t40.5 23l35-35q12-12 28.5-12t28.5 12q12 12 12 28t-12 28l-37 37q2 4 4.5 8t4.5 9l25 50 46-46q12-12 28.5-12t28.5 12q12 12 12 28.5T678-625l-48 47 56 28q6 3 12.5 6.5T710-536l40-40q12-12 28-12t28 12q12 12 12 28.5T806-519l-40 39q12 18 19.5 38t11.5 42h43q17 0 28.5 11.5T880-360q0 17-11.5 28.5T840-320h-45q-5 19-12 35.5T765-252l34 34q12 12 12 28.5T799-161q-12 11-28.5 11.5T742-161l-33-34q-16 11-33 18t-36 12v45q0 17-11.5 28.5T600-80Zm-6-160q58 0 95.5-44T718-386q-5-30-22.5-54T650-478l-66-34q-23-12-41.5-30.5T512-584l-34-66q-16-32-46-51t-66-19q-58 0-95.5 44T242-574q5 30 22.5 54t45.5 38l66 34q23 12 41.5 30.5T448-376l34 66q16 32 46 51t66 19ZM380-540q25 0 42.5-17.5T440-600q0-25-17.5-42.5T380-660q-25 0-42.5 17.5T320-600q0 25 17.5 42.5T380-540Zm200 250q21 0 35.5-14.5T630-340q0-21-14.5-35.5T580-390q-21 0-35.5 14.5T530-340q0 21 14.5 35.5T580-290ZM480-480Z"/></svg>
        `;
      case "filter":
        return /*html*/ `
          <svg width="20" height="20" viewBox="0 0 40 40">
            <line class="top" x1="0" y1="7" x2="40" y2="7" />
            <line class="middle" x1="8" y1="20" x2="32" y2="20" />
            <line class="bottom" x1="15" y1="33" x2="25  " y2="33" />
          </svg>  
        `;
      case "nofilter":
        return /*html*/ `
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M791-55 55-791l57-57 736 736-57 57ZM633-440l-80-80h167v80h-87ZM433-640l-80-80h487v80H433Zm-33 400v-80h160v80H400ZM240-440v-80h166v80H240ZM120-640v-80h86v80h-86Z"/></svg>
        `;
      default:
        return "";
    }
  }

  static menuStructure(
    filterSections,
    firstSpecies,
    additionalSpeciesCount = 0
  ) {
    let selectedHint = `Showing ${firstSpecies}`;
    if (additionalSpeciesCount > 0) {
      selectedHint += ` +${additionalSpeciesCount} others...`;
    }

    let sections = "";
    filterSections.forEach((section) => {
      sections += /*html*/ `
        <div
            class="menu-section"
        >
            <div class="menu-section-header d-flex justify-content-between mt-2 mb-3">
              <div>
                ${HTMLhelper.icons(section.name)} 
                ${toTitleCase(section.name)}
              </div>
              <div class="d-flex flex-row justify-end align-center">
                <div class="section-filter-count filter-counter hide">0</div>
                <svg class="chevron chevron-button subsection-chevron" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
              </div>

            </div>
            <input
            type="text"
            id="${section.name}SearchBox"
            placeholder="Search ${toTitleCase(section.name)}..."
            class="form-control mb-2 menu-section-search"
            />
            <div class="w-100 scroll-container menu-sub-section">
                ${section.string}
            </div>
        </div>
    `;
    });
    return /*html*/ `
    <div id="sidebar-menu-group" class="d-flex flex-row h-100">
      <div id="filter-menu-container" class="menu-box h-100 z-2">
        ${HTMLhelper.menuHeader("Map Options", "filter")}
        <div id="taxonomySelectorMenuGroup" class="invisible">
          <p id="taxonomyHint">
            ${selectedHint}
          </p>
          <div class="d-flex flex-row justify-content-between align-center">
            <button id="openTaxonModal" class="filter-menu-btn w-100">Modify Selection</button>
          </div>
        </div>
        <h2 class="mt-2"><span style="font-weight: 500;">Filters</span></h2>
        <div class="menu-content invisible">
          ${sections}
        </div>
        <button class="invisible menu-section clear-btn filter-menu-btn flex-row justify-center align-center">
          <span>${HTMLhelper.icons("nofilter")}<span>Clear Filters
        </button>
      </div>
    </div>

    `;
  }

  static chartSelector(
    chartSection,
    backgroundColor,
    svg = null,
    svgOnly = false
  ) {
    let background = backgroundColor;
    if (backgroundColor != "inherit") {
      const background = hexToRgba(backgroundColor, 0.7);
    }
    const content = svg
      ? svgOnly
        ? svg
        : svg + " " + toTitleCase(chartSection)
      : toTitleCase(chartSection);
    return /*html*/ `
    <button id="${chartSection}" style="background-color: ${background};" class="btn chart-selector-btn">${content}</button>
    `;
  }
  static chartOptions() {
    const stackTypes = ["genus", "species"];

    const sortTypes = ["none", "alpha", "count"];

    let stackSectionString = stackTypes
      .map((type, index) => {
        return /*html*/ `
        <input type="radio" id="${type}-stack-radio" name="stack-radio" value="${type}" ${
          index == 0 ? "checked" : ""
        }>
          <label for="${type}-stack-radio">
            ${toTitleCase(type)}
          </label>
      `;
      })
      .join("");

    let sortSectionString = sortTypes
      .map((type, index) => {
        return /*html*/ `
        <input type="radio" id="${type}-sort-radio" name="sort-radio" value="${type}" ${
          index == 0 ? "checked" : ""
        }>
        <label for="${type}-sort-radio">
          ${toTitleCase(type)}
        </label>
      `;
      })
      .join("");

    return /*html*/ `
      <section id="chart-options">
        <h2>Chart Options</h2>
        <div id="stack-mode" class="chart-options-group">
          <h3>Stack Mode: </h3>
          ${stackSectionString}
        </div>
        <div id="sort-mode" class="chart-options-group">
          <h3>Sort Mode: </h3>
          ${sortSectionString}
        </div>
      </section>
    `;
  }

  static taxonomyModal(taxonJSON) {
    const taxonomyTree = HTMLhelper.taxon(taxonJSON);
    let htmlString = /*html*/ `
      <div class="d-flex flex-row align-center justify-content-between">
        <section id="available-taxonomies">
          <h2>Available Genomes</h2>
          <div id="modal-search-box" class="mt-2 mb-2">
            <input id="taxonomy-search" type="search" placeholder="Search family, genus, or species" autocomplete="off" />
          </div>
          <div id="available-taxonomy-tree" class="scroll-container">
            ${taxonomyTree}
          </div>
        </section>
        <section id="selectedTaxonomies">
          <h2>Your Selection</h2>
          <div class="scroll-container mt-2">
            <ul class="list-tree" id="selected-tree"></ul>
          </div>
        </section>
      </div>

    `;

    return htmlString;
  }

  static taxon(taxonData) {
    const taxonHTMLContainer = document.createElement("section");
    const taxonUlEl = document.createElement("ul");
    taxonUlEl.classList.add("list-tree");
    taxonHTMLContainer.appendChild(taxonUlEl);

    const slug = (s) =>
      String(s)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
    const mkId = (side, level, family, genus, species) =>
      `${side}-${level}-${[family, genus, species]
        .filter(Boolean)
        .map(slug)
        .join("__")}`;

    const stopToggle = (el) => {
      // prevent clicking the checkbox from toggling <details>
      el.addEventListener("click", (e) => e.stopPropagation());
    };

    const mkCheckbox = (side, level, labels) => {
      const { family, genus, species, text } = labels;
      const id = mkId(side, level, family, genus, species);

      const input = document.createElement("input");
      input.type = "checkbox";
      input.className = "taxon-checkbox";
      input.id = id;
      input.dataset.level = level;
      if (family) input.dataset.family = family;
      if (genus) input.dataset.genus = genus;
      if (species) input.dataset.species = species;
      input.dataset.label = text;

      const label = document.createElement("label");
      label.setAttribute("for", id);
      label.textContent = text;

      stopToggle(input);

      return { input, label };
    };

    const families = Object.keys(taxonData);
    families.forEach((family) => {
      const famLi = document.createElement("li");
      const famDetails = document.createElement("details");
      famDetails.open = true;
      const famSummary = document.createElement("summary");

      const famChevron = document.createElement("span");
      famChevron.classList.add("tree-chevron");
      famChevron.setAttribute("aria-hidden", "true");
      famSummary.appendChild(famChevron);

      const famCb = mkCheckbox("avail", "family", {
        family,
        text: toTitleCase(family),
      });
      famSummary.append(famCb.input, famCb.label);
      famDetails.appendChild(famSummary);

      const famUl = document.createElement("ul");
      famDetails.appendChild(famUl);
      famLi.appendChild(famDetails);
      taxonUlEl.appendChild(famLi);

      Object.keys(taxonData[family]).forEach((genus) => {
        const genLi = document.createElement("li");
        const genDetails = document.createElement("details");
        // keep closed by default for genus
        const genSummary = document.createElement("summary");

        const genChevron = document.createElement("span");
        genChevron.classList.add("tree-chevron");
        genChevron.setAttribute("aria-hidden", "true");
        genSummary.appendChild(genChevron);

        const genCb = mkCheckbox("avail", "genus", {
          family,
          genus,
          text: toTitleCase(genus),
        });
        genSummary.append(genCb.input, genCb.label);
        genDetails.appendChild(genSummary);

        const genUl = document.createElement("ul");
        genDetails.appendChild(genUl);
        genLi.appendChild(genDetails);
        famUl.appendChild(genLi);

        taxonData[family][genus].forEach((species) => {
          const spLi = document.createElement("li");
          spLi.classList.add("leaf");

          const spWrap = document.createElement("div"); // keeps consistent layout
          const spCb = mkCheckbox("avail", "species", {
            family,
            genus,
            species,
            text: toTitleCase(species),
          });
          spWrap.append(spCb.input, spCb.label);
          spLi.appendChild(spWrap);

          genUl.appendChild(spLi);
        });
      });
    });

    // return HTML string for your template usage
    return taxonHTMLContainer.innerHTML;
  }
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

function sumMap(m) {
  let s = 0;
  if (!m) return s;
  for (const v of m.values()) s += v;
  return s;
}

function hexToRgba(hex, alpha) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(
    result[2],
    16
  )}, ${parseInt(result[3], 16)}, ${alpha})`;
}

const colorPalette = {
  vibrantTones: [
    "#F94144",
    "#277DA1",
    "#F3722C",
    "#577590",
    "#F8961E",
    "#4D908E",
    "#F9844A",
    "#43AA8B",
    "#F9C74F",
    "#43AA8B",
    "#90BE6D",
  ],
  sunnyBeachDay: ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"],
  warmAutumnGlow: ["#003049", "#d62828", "#f77f00", "#fcbf49", "#eae2b7"],
  warmAutumnGlow2: ["#003049", "#fcbf49", "#d62828", "#f77f00"],

  refreshingSummerFun: ["#fb8500", "#ffb703", "#023047", "#219ebc", "#8ecae6"],

  purpleSunset: ["#390099", "#9e0059", "#ff0054", "#ff5400", "#ffbd00"],
  oceanSunset: ["#001427", "#708d81", "#f4d58d", "#bf0603", "#8d0801"],

  warmEarthTones: ["#8c1c13", "#bf4342", "#e7d7c1", "#a78a7f", "#735751"],
};

function* getBarColor(palette) {
  const colors = palette ?? colorPalette.sunnyBeachDay;
  let index = 0;
  while (true) {
    yield colors[index % colors.length];
    index++;
  }
}

function getRandomColor() {
  let letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const geoLookup = {
  "united states": {
    states: {
      alaska: {
        state_code: "AK",
        state_latitude: "63.588753",
        state_longitude: "-154.493062",
      },
      alabama: {
        state_code: "AL",
        state_latitude: "32.318231",
        state_longitude: "-86.902298",
      },
      arkansas: {
        state_code: "AR",
        state_latitude: "35.20105",
        state_longitude: "-91.831833",
      },
      arizona: {
        state_code: "AZ",
        state_latitude: "34.048928",
        state_longitude: "-111.093731",
      },
      california: {
        state_code: "CA",
        state_latitude: "36.778261",
        state_longitude: "-119.417932",
      },
      colorado: {
        state_code: "CO",
        state_latitude: "39.550051",
        state_longitude: "-105.782067",
      },
      connecticut: {
        state_code: "CT",
        state_latitude: "41.603221",
        state_longitude: "-73.087749",
      },
      "district of columbia": {
        state_code: "DC",
        state_latitude: "38.905985",
        state_longitude: "-77.033418",
      },
      delaware: {
        state_code: "DE",
        state_latitude: "38.910832",
        state_longitude: "-75.52767",
      },
      florida: {
        state_code: "FL",
        state_latitude: "27.664827",
        state_longitude: "-81.515754",
      },
      georgia: {
        state_code: "GA",
        state_latitude: "32.157435",
        state_longitude: "-82.907123",
      },
      hawaii: {
        state_code: "HI",
        state_latitude: "19.898682",
        state_longitude: "-155.665857",
      },
      iowa: {
        state_code: "IA",
        state_latitude: "41.878003",
        state_longitude: "-93.097702",
      },
      idaho: {
        state_code: "ID",
        state_latitude: "44.068202",
        state_longitude: "-114.742041",
      },
      illinois: {
        state_code: "IL",
        state_latitude: "40.633125",
        state_longitude: "-89.398528",
      },
      indiana: {
        state_code: "IN",
        state_latitude: "40.551217",
        state_longitude: "-85.602364",
      },
      kansas: {
        state_code: "KS",
        state_latitude: "39.011902",
        state_longitude: "-98.484246",
      },
      kentucky: {
        state_code: "KY",
        state_latitude: "37.839333",
        state_longitude: "-84.270018",
      },
      louisiana: {
        state_code: "LA",
        state_latitude: "31.244823",
        state_longitude: "-92.145024",
      },
      massachusetts: {
        state_code: "MA",
        state_latitude: "42.407211",
        state_longitude: "-71.382437",
      },
      maryland: {
        state_code: "MD",
        state_latitude: "39.045755",
        state_longitude: "-76.641271",
      },
      maine: {
        state_code: "ME",
        state_latitude: "45.253783",
        state_longitude: "-69.445469",
      },
      michigan: {
        state_code: "MI",
        state_latitude: "44.314844",
        state_longitude: "-85.602364",
      },
      minnesota: {
        state_code: "MN",
        state_latitude: "46.729553",
        state_longitude: "-94.6859",
      },
      missouri: {
        state_code: "MO",
        state_latitude: "37.964253",
        state_longitude: "-91.831833",
      },
      mississippi: {
        state_code: "MS",
        state_latitude: "32.354668",
        state_longitude: "-89.398528",
      },
      montana: {
        state_code: "MT",
        state_latitude: "46.879682",
        state_longitude: "-110.362566",
      },
      "north carolina": {
        state_code: "NC",
        state_latitude: "35.759573",
        state_longitude: "-79.0193",
      },
      "north dakota": {
        state_code: "ND",
        state_latitude: "47.551493",
        state_longitude: "-101.002012",
      },
      nebraska: {
        state_code: "NE",
        state_latitude: "41.492537",
        state_longitude: "-99.901813",
      },
      "new hampshire": {
        state_code: "NH",
        state_latitude: "43.193852",
        state_longitude: "-71.572395",
      },
      "new jersey": {
        state_code: "NJ",
        state_latitude: "40.058324",
        state_longitude: "-74.405661",
      },
      "new mexico": {
        state_code: "NM",
        state_latitude: "34.97273",
        state_longitude: "-105.032363",
      },
      nevada: {
        state_code: "NV",
        state_latitude: "38.80261",
        state_longitude: "-116.419389",
      },
      "new york": {
        state_code: "NY",
        state_latitude: "43.299428",
        state_longitude: "-74.217933",
      },
      ohio: {
        state_code: "OH",
        state_latitude: "40.417287",
        state_longitude: "-82.907123",
      },
      oklahoma: {
        state_code: "OK",
        state_latitude: "35.007752",
        state_longitude: "-97.092877",
      },
      oregon: {
        state_code: "OR",
        state_latitude: "43.804133",
        state_longitude: "-120.554201",
      },
      pennsylvania: {
        state_code: "PA",
        state_latitude: "41.203322",
        state_longitude: "-77.194525",
      },
      "puerto rico": {
        state_code: "PR",
        state_latitude: "18.220833",
        state_longitude: "-66.590149",
      },
      "rhode island": {
        state_code: "RI",
        state_latitude: "41.580095",
        state_longitude: "-71.477429",
      },
      "south carolina": {
        state_code: "SC",
        state_latitude: "33.836081",
        state_longitude: "-81.163725",
      },
      "south dakota": {
        state_code: "SD",
        state_latitude: "43.969515",
        state_longitude: "-99.901813",
      },
      tennessee: {
        state_code: "TN",
        state_latitude: "35.517491",
        state_longitude: "-86.580447",
      },
      texas: {
        state_code: "TX",
        state_latitude: "31.968599",
        state_longitude: "-99.901813",
      },
      utah: {
        state_code: "UT",
        state_latitude: "39.32098",
        state_longitude: "-111.093731",
      },
      virginia: {
        state_code: "VA",
        state_latitude: "37.431573",
        state_longitude: "-78.656894",
      },
      vermont: {
        state_code: "VT",
        state_latitude: "44.558803",
        state_longitude: "-72.577841",
      },
      washington: {
        state_code: "WA",
        state_latitude: "47.751074",
        state_longitude: "-120.740139",
      },
      wisconsin: {
        state_code: "WI",
        state_latitude: "43.78444",
        state_longitude: "-88.787868",
      },
      "west virginia": {
        state_code: "WV",
        state_latitude: "38.597626",
        state_longitude: "-80.454903",
      },
      wyoming: {
        state_code: "WY",
        state_latitude: "43.075968",
        state_longitude: "-107.290284",
      },
    },
    country_code: "US",
    country_latitude: "37.09024",
    country_longitude: "-95.712891",
  },
  andorra: {
    country_code: "AD",
    country_latitude: "42.546245",
    country_longitude: "1.601554",
  },
  "united arab emirates": {
    country_code: "AE",
    country_latitude: "23.424076",
    country_longitude: "53.847818",
  },
  afghanistan: {
    country_code: "AF",
    country_latitude: "33.93911",
    country_longitude: "67.709953",
  },
  "antigua and barbuda": {
    country_code: "AG",
    country_latitude: "17.060816",
    country_longitude: "-61.796428",
  },
  anguilla: {
    country_code: "AI",
    country_latitude: "18.220554",
    country_longitude: "-63.068615",
  },
  albania: {
    country_code: "AL",
    country_latitude: "41.153332",
    country_longitude: "20.168331",
  },
  armenia: {
    country_code: "AM",
    country_latitude: "40.069099",
    country_longitude: "45.038189",
  },
  "netherlands antilles": {
    country_code: "AN",
    country_latitude: "12.226079",
    country_longitude: "-69.060087",
  },
  angola: {
    country_code: "AO",
    country_latitude: "-11.202692",
    country_longitude: "17.873887",
  },
  antarctica: {
    country_code: "AQ",
    country_latitude: "-75.250973",
    country_longitude: "-0.071389",
  },
  argentina: {
    country_code: "AR",
    country_latitude: "-38.416097",
    country_longitude: "-63.616672",
  },
  "american samoa": {
    country_code: "AS",
    country_latitude: "-14.270972",
    country_longitude: "-170.132217",
  },
  austria: {
    country_code: "AT",
    country_latitude: "47.516231",
    country_longitude: "14.550072",
  },
  australia: {
    country_code: "AU",
    country_latitude: "-25.274398",
    country_longitude: "133.775136",
  },
  aruba: {
    country_code: "AW",
    country_latitude: "12.52111",
    country_longitude: "-69.968338",
  },
  azerbaijan: {
    country_code: "AZ",
    country_latitude: "40.143105",
    country_longitude: "47.576927",
  },
  "bosnia and herzegovina": {
    country_code: "BA",
    country_latitude: "43.915886",
    country_longitude: "17.679076",
  },
  barbados: {
    country_code: "BB",
    country_latitude: "13.193887",
    country_longitude: "-59.543198",
  },
  bangladesh: {
    country_code: "BD",
    country_latitude: "23.684994",
    country_longitude: "90.356331",
  },
  belgium: {
    country_code: "BE",
    country_latitude: "50.503887",
    country_longitude: "4.469936",
  },
  "burkina faso": {
    country_code: "BF",
    country_latitude: "12.238333",
    country_longitude: "-1.561593",
  },
  bulgaria: {
    country_code: "BG",
    country_latitude: "42.733883",
    country_longitude: "25.48583",
  },
  bahrain: {
    country_code: "BH",
    country_latitude: "25.930414",
    country_longitude: "50.637772",
  },
  burundi: {
    country_code: "BI",
    country_latitude: "-3.373056",
    country_longitude: "29.918886",
  },
  benin: {
    country_code: "BJ",
    country_latitude: "9.30769",
    country_longitude: "2.315834",
  },
  bermuda: {
    country_code: "BM",
    country_latitude: "32.321384",
    country_longitude: "-64.75737",
  },
  brunei: {
    country_code: "BN",
    country_latitude: "4.535277",
    country_longitude: "114.727669",
  },
  bolivia: {
    country_code: "BO",
    country_latitude: "-16.290154",
    country_longitude: "-63.588653",
  },
  brazil: {
    country_code: "BR",
    country_latitude: "-14.235004",
    country_longitude: "-51.92528",
  },
  bahamas: {
    country_code: "BS",
    country_latitude: "25.03428",
    country_longitude: "-77.39628",
  },
  bhutan: {
    country_code: "BT",
    country_latitude: "27.514162",
    country_longitude: "90.433601",
  },
  "bouvet island": {
    country_code: "BV",
    country_latitude: "-54.423199",
    country_longitude: "3.413194",
  },
  botswana: {
    country_code: "BW",
    country_latitude: "-22.328474",
    country_longitude: "24.684866",
  },
  belarus: {
    country_code: "BY",
    country_latitude: "53.709807",
    country_longitude: "27.953389",
  },
  belize: {
    country_code: "BZ",
    country_latitude: "17.189877",
    country_longitude: "-88.49765",
  },
  canada: {
    country_code: "CA",
    country_latitude: "56.130366",
    country_longitude: "-106.346771",
  },
  "cocos [keeling] islands": {
    country_code: "CC",
    country_latitude: "-12.164165",
    country_longitude: "96.870956",
  },
  "congo [drc]": {
    country_code: "CD",
    country_latitude: "-4.038333",
    country_longitude: "21.758664",
  },
  "central african republic": {
    country_code: "CF",
    country_latitude: "6.611111",
    country_longitude: "20.939444",
  },
  "congo [republic]": {
    country_code: "CG",
    country_latitude: "-0.228021",
    country_longitude: "15.827659",
  },
  switzerland: {
    country_code: "CH",
    country_latitude: "46.818188",
    country_longitude: "8.227512",
  },
  "c\u00e3\u00b4te d'ivoire": {
    country_code: "CI",
    country_latitude: "7.539989",
    country_longitude: "-5.54708",
  },
  "cook islands": {
    country_code: "CK",
    country_latitude: "-21.236736",
    country_longitude: "-159.777671",
  },
  chile: {
    country_code: "CL",
    country_latitude: "-35.675147",
    country_longitude: "-71.542969",
  },
  cameroon: {
    country_code: "CM",
    country_latitude: "7.369722",
    country_longitude: "12.354722",
  },
  china: {
    country_code: "CN",
    country_latitude: "35.86166",
    country_longitude: "104.195397",
  },
  colombia: {
    country_code: "CO",
    country_latitude: "4.570868",
    country_longitude: "-74.297333",
  },
  "costa rica": {
    country_code: "CR",
    country_latitude: "9.748917",
    country_longitude: "-83.753428",
  },
  cuba: {
    country_code: "CU",
    country_latitude: "21.521757",
    country_longitude: "-77.781167",
  },
  "cape verde": {
    country_code: "CV",
    country_latitude: "16.002082",
    country_longitude: "-24.013197",
  },
  "christmas island": {
    country_code: "CX",
    country_latitude: "-10.447525",
    country_longitude: "105.690449",
  },
  cyprus: {
    country_code: "CY",
    country_latitude: "35.126413",
    country_longitude: "33.429859",
  },
  "czech republic": {
    country_code: "CZ",
    country_latitude: "49.817492",
    country_longitude: "15.472962",
  },
  germany: {
    country_code: "DE",
    country_latitude: "51.165691",
    country_longitude: "10.451526",
  },
  djibouti: {
    country_code: "DJ",
    country_latitude: "11.825138",
    country_longitude: "42.590275",
  },
  denmark: {
    country_code: "DK",
    country_latitude: "56.26392",
    country_longitude: "9.501785",
  },
  dominica: {
    country_code: "DM",
    country_latitude: "15.414999",
    country_longitude: "-61.370976",
  },
  "dominican republic": {
    country_code: "DO",
    country_latitude: "18.735693",
    country_longitude: "-70.162651",
  },
  algeria: {
    country_code: "DZ",
    country_latitude: "28.033886",
    country_longitude: "1.659626",
  },
  ecuador: {
    country_code: "EC",
    country_latitude: "-1.831239",
    country_longitude: "-78.183406",
  },
  estonia: {
    country_code: "EE",
    country_latitude: "58.595272",
    country_longitude: "25.013607",
  },
  egypt: {
    country_code: "EG",
    country_latitude: "26.820553",
    country_longitude: "30.802498",
  },
  "western sahara": {
    country_code: "EH",
    country_latitude: "24.215527",
    country_longitude: "-12.885834",
  },
  eritrea: {
    country_code: "ER",
    country_latitude: "15.179384",
    country_longitude: "39.782334",
  },
  spain: {
    country_code: "ES",
    country_latitude: "40.463667",
    country_longitude: "-3.74922",
  },
  ethiopia: {
    country_code: "ET",
    country_latitude: "9.145",
    country_longitude: "40.489673",
  },
  finland: {
    country_code: "FI",
    country_latitude: "61.92411",
    country_longitude: "25.748151",
  },
  fiji: {
    country_code: "FJ",
    country_latitude: "-16.578193",
    country_longitude: "179.414413",
  },
  "falkland islands [islas malvinas]": {
    country_code: "FK",
    country_latitude: "-51.796253",
    country_longitude: "-59.523613",
  },
  micronesia: {
    country_code: "FM",
    country_latitude: "7.425554",
    country_longitude: "150.550812",
  },
  "faroe islands": {
    country_code: "FO",
    country_latitude: "61.892635",
    country_longitude: "-6.911806",
  },
  france: {
    country_code: "FR",
    country_latitude: "46.227638",
    country_longitude: "2.213749",
  },
  gabon: {
    country_code: "GA",
    country_latitude: "-0.803689",
    country_longitude: "11.609444",
  },
  "united kingdom": {
    country_code: "GB",
    country_latitude: "55.378051",
    country_longitude: "-3.435973",
  },
  grenada: {
    country_code: "GD",
    country_latitude: "12.262776",
    country_longitude: "-61.604171",
  },
  georgia: {
    country_code: "GE",
    country_latitude: "42.315407",
    country_longitude: "43.356892",
  },
  "french guiana": {
    country_code: "GF",
    country_latitude: "3.933889",
    country_longitude: "-53.125782",
  },
  guernsey: {
    country_code: "GG",
    country_latitude: "49.465691",
    country_longitude: "-2.585278",
  },
  ghana: {
    country_code: "GH",
    country_latitude: "7.946527",
    country_longitude: "-1.023194",
  },
  gibraltar: {
    country_code: "GI",
    country_latitude: "36.137741",
    country_longitude: "-5.345374",
  },
  greenland: {
    country_code: "GL",
    country_latitude: "71.706936",
    country_longitude: "-42.604303",
  },
  gambia: {
    country_code: "GM",
    country_latitude: "13.443182",
    country_longitude: "-15.310139",
  },
  guinea: {
    country_code: "GN",
    country_latitude: "9.945587",
    country_longitude: "-9.696645",
  },
  guadeloupe: {
    country_code: "GP",
    country_latitude: "16.995971",
    country_longitude: "-62.067641",
  },
  "equatorial guinea": {
    country_code: "GQ",
    country_latitude: "1.650801",
    country_longitude: "10.267895",
  },
  greece: {
    country_code: "GR",
    country_latitude: "39.074208",
    country_longitude: "21.824312",
  },
  "south georgia and the south sandwich islands": {
    country_code: "GS",
    country_latitude: "-54.429579",
    country_longitude: "-36.587909",
  },
  guatemala: {
    country_code: "GT",
    country_latitude: "15.783471",
    country_longitude: "-90.230759",
  },
  guam: {
    country_code: "GU",
    country_latitude: "13.444304",
    country_longitude: "144.793731",
  },
  "guinea-bissau": {
    country_code: "GW",
    country_latitude: "11.803749",
    country_longitude: "-15.180413",
  },
  guyana: {
    country_code: "GY",
    country_latitude: "4.860416",
    country_longitude: "-58.93018",
  },
  "gaza strip": {
    country_code: "GZ",
    country_latitude: "31.354676",
    country_longitude: "34.308825",
  },
  "hong kong": {
    country_code: "HK",
    country_latitude: "22.396428",
    country_longitude: "114.109497",
  },
  "heard island and mcdonald islands": {
    country_code: "HM",
    country_latitude: "-53.08181",
    country_longitude: "73.504158",
  },
  honduras: {
    country_code: "HN",
    country_latitude: "15.199999",
    country_longitude: "-86.241905",
  },
  croatia: {
    country_code: "HR",
    country_latitude: "45.1",
    country_longitude: "15.2",
  },
  haiti: {
    country_code: "HT",
    country_latitude: "18.971187",
    country_longitude: "-72.285215",
  },
  hungary: {
    country_code: "HU",
    country_latitude: "47.162494",
    country_longitude: "19.503304",
  },
  indonesia: {
    country_code: "ID",
    country_latitude: "-0.789275",
    country_longitude: "113.921327",
  },
  ireland: {
    country_code: "IE",
    country_latitude: "53.41291",
    country_longitude: "-8.24389",
  },
  israel: {
    country_code: "IL",
    country_latitude: "31.046051",
    country_longitude: "34.851612",
  },
  "isle of man": {
    country_code: "IM",
    country_latitude: "54.236107",
    country_longitude: "-4.548056",
  },
  india: {
    country_code: "IN",
    country_latitude: "20.593684",
    country_longitude: "78.96288",
  },
  "british indian ocean territory": {
    country_code: "IO",
    country_latitude: "-6.343194",
    country_longitude: "71.876519",
  },
  iraq: {
    country_code: "IQ",
    country_latitude: "33.223191",
    country_longitude: "43.679291",
  },
  iran: {
    country_code: "IR",
    country_latitude: "32.427908",
    country_longitude: "53.688046",
  },
  iceland: {
    country_code: "IS",
    country_latitude: "64.963051",
    country_longitude: "-19.020835",
  },
  italy: {
    country_code: "IT",
    country_latitude: "41.87194",
    country_longitude: "12.56738",
  },
  jersey: {
    country_code: "JE",
    country_latitude: "49.214439",
    country_longitude: "-2.13125",
  },
  jamaica: {
    country_code: "JM",
    country_latitude: "18.109581",
    country_longitude: "-77.297508",
  },
  jordan: {
    country_code: "JO",
    country_latitude: "30.585164",
    country_longitude: "36.238414",
  },
  japan: {
    country_code: "JP",
    country_latitude: "36.204824",
    country_longitude: "138.252924",
  },
  kenya: {
    country_code: "KE",
    country_latitude: "-0.023559",
    country_longitude: "37.906193",
  },
  kyrgyzstan: {
    country_code: "KG",
    country_latitude: "41.20438",
    country_longitude: "74.766098",
  },
  cambodia: {
    country_code: "KH",
    country_latitude: "12.565679",
    country_longitude: "104.990963",
  },
  kiribati: {
    country_code: "KI",
    country_latitude: "-3.370417",
    country_longitude: "-168.734039",
  },
  comoros: {
    country_code: "KM",
    country_latitude: "-11.875001",
    country_longitude: "43.872219",
  },
  "saint kitts and nevis": {
    country_code: "KN",
    country_latitude: "17.357822",
    country_longitude: "-62.782998",
  },
  "north korea": {
    country_code: "KP",
    country_latitude: "40.339852",
    country_longitude: "127.510093",
  },
  "south korea": {
    country_code: "KR",
    country_latitude: "35.907757",
    country_longitude: "127.766922",
  },
  kuwait: {
    country_code: "KW",
    country_latitude: "29.31166",
    country_longitude: "47.481766",
  },
  "cayman islands": {
    country_code: "KY",
    country_latitude: "19.513469",
    country_longitude: "-80.566956",
  },
  kazakhstan: {
    country_code: "KZ",
    country_latitude: "48.019573",
    country_longitude: "66.923684",
  },
  laos: {
    country_code: "LA",
    country_latitude: "19.85627",
    country_longitude: "102.495496",
  },
  lebanon: {
    country_code: "LB",
    country_latitude: "33.854721",
    country_longitude: "35.862285",
  },
  "saint lucia": {
    country_code: "LC",
    country_latitude: "13.909444",
    country_longitude: "-60.978893",
  },
  liechtenstein: {
    country_code: "LI",
    country_latitude: "47.166",
    country_longitude: "9.555373",
  },
  "sri lanka": {
    country_code: "LK",
    country_latitude: "7.873054",
    country_longitude: "80.771797",
  },
  liberia: {
    country_code: "LR",
    country_latitude: "6.428055",
    country_longitude: "-9.429499",
  },
  lesotho: {
    country_code: "LS",
    country_latitude: "-29.609988",
    country_longitude: "28.233608",
  },
  lithuania: {
    country_code: "LT",
    country_latitude: "55.169438",
    country_longitude: "23.881275",
  },
  luxembourg: {
    country_code: "LU",
    country_latitude: "49.815273",
    country_longitude: "6.129583",
  },
  latvia: {
    country_code: "LV",
    country_latitude: "56.879635",
    country_longitude: "24.603189",
  },
  libya: {
    country_code: "LY",
    country_latitude: "26.3351",
    country_longitude: "17.228331",
  },
  morocco: {
    country_code: "MA",
    country_latitude: "31.791702",
    country_longitude: "-7.09262",
  },
  monaco: {
    country_code: "MC",
    country_latitude: "43.750298",
    country_longitude: "7.412841",
  },
  moldova: {
    country_code: "MD",
    country_latitude: "47.411631",
    country_longitude: "28.369885",
  },
  montenegro: {
    country_code: "ME",
    country_latitude: "42.708678",
    country_longitude: "19.37439",
  },
  madagascar: {
    country_code: "MG",
    country_latitude: "-18.766947",
    country_longitude: "46.869107",
  },
  "marshall islands": {
    country_code: "MH",
    country_latitude: "7.131474",
    country_longitude: "171.184478",
  },
  "macedonia [fyrom]": {
    country_code: "MK",
    country_latitude: "41.608635",
    country_longitude: "21.745275",
  },
  mali: {
    country_code: "ML",
    country_latitude: "17.570692",
    country_longitude: "-3.996166",
  },
  "myanmar [burma]": {
    country_code: "MM",
    country_latitude: "21.913965",
    country_longitude: "95.956223",
  },
  mongolia: {
    country_code: "MN",
    country_latitude: "46.862496",
    country_longitude: "103.846656",
  },
  macau: {
    country_code: "MO",
    country_latitude: "22.198745",
    country_longitude: "113.543873",
  },
  "northern mariana islands": {
    country_code: "MP",
    country_latitude: "17.33083",
    country_longitude: "145.38469",
  },
  martinique: {
    country_code: "MQ",
    country_latitude: "14.641528",
    country_longitude: "-61.024174",
  },
  mauritania: {
    country_code: "MR",
    country_latitude: "21.00789",
    country_longitude: "-10.940835",
  },
  montserrat: {
    country_code: "MS",
    country_latitude: "16.742498",
    country_longitude: "-62.187366",
  },
  malta: {
    country_code: "MT",
    country_latitude: "35.937496",
    country_longitude: "14.375416",
  },
  mauritius: {
    country_code: "MU",
    country_latitude: "-20.348404",
    country_longitude: "57.552152",
  },
  maldives: {
    country_code: "MV",
    country_latitude: "3.202778",
    country_longitude: "73.22068",
  },
  malawi: {
    country_code: "MW",
    country_latitude: "-13.254308",
    country_longitude: "34.301525",
  },
  mexico: {
    country_code: "MX",
    country_latitude: "23.634501",
    country_longitude: "-102.552784",
  },
  malaysia: {
    country_code: "MY",
    country_latitude: "4.210484",
    country_longitude: "101.975766",
  },
  mozambique: {
    country_code: "MZ",
    country_latitude: "-18.665695",
    country_longitude: "35.529562",
  },
  namibia: {
    country_code: "NA",
    country_latitude: "-22.95764",
    country_longitude: "18.49041",
  },
  "new caledonia": {
    country_code: "NC",
    country_latitude: "-20.904305",
    country_longitude: "165.618042",
  },
  niger: {
    country_code: "NE",
    country_latitude: "17.607789",
    country_longitude: "8.081666",
  },
  "norfolk island": {
    country_code: "NF",
    country_latitude: "-29.040835",
    country_longitude: "167.954712",
  },
  nigeria: {
    country_code: "NG",
    country_latitude: "9.081999",
    country_longitude: "8.675277",
  },
  nicaragua: {
    country_code: "NI",
    country_latitude: "12.865416",
    country_longitude: "-85.207229",
  },
  netherlands: {
    country_code: "NL",
    country_latitude: "52.132633",
    country_longitude: "5.291266",
  },
  norway: {
    country_code: "NO",
    country_latitude: "60.472024",
    country_longitude: "8.468946",
  },
  nepal: {
    country_code: "NP",
    country_latitude: "28.394857",
    country_longitude: "84.124008",
  },
  nauru: {
    country_code: "NR",
    country_latitude: "-0.522778",
    country_longitude: "166.931503",
  },
  niue: {
    country_code: "NU",
    country_latitude: "-19.054445",
    country_longitude: "-169.867233",
  },
  "new zealand": {
    country_code: "NZ",
    country_latitude: "-40.900557",
    country_longitude: "174.885971",
  },
  oman: {
    country_code: "OM",
    country_latitude: "21.512583",
    country_longitude: "55.923255",
  },
  panama: {
    country_code: "PA",
    country_latitude: "8.537981",
    country_longitude: "-80.782127",
  },
  peru: {
    country_code: "PE",
    country_latitude: "-9.189967",
    country_longitude: "-75.015152",
  },
  "french polynesia": {
    country_code: "PF",
    country_latitude: "-17.679742",
    country_longitude: "-149.406843",
  },
  "papua new guinea": {
    country_code: "PG",
    country_latitude: "-6.314993",
    country_longitude: "143.95555",
  },
  philippines: {
    country_code: "PH",
    country_latitude: "12.879721",
    country_longitude: "121.774017",
  },
  pakistan: {
    country_code: "PK",
    country_latitude: "30.375321",
    country_longitude: "69.345116",
  },
  poland: {
    country_code: "PL",
    country_latitude: "51.919438",
    country_longitude: "19.145136",
  },
  "saint pierre and miquelon": {
    country_code: "PM",
    country_latitude: "46.941936",
    country_longitude: "-56.27111",
  },
  "pitcairn islands": {
    country_code: "PN",
    country_latitude: "-24.703615",
    country_longitude: "-127.439308",
  },
  "puerto rico": {
    country_code: "PR",
    country_latitude: "18.220833",
    country_longitude: "-66.590149",
  },
  "palestinian territories": {
    country_code: "PS",
    country_latitude: "31.952162",
    country_longitude: "35.233154",
  },
  portugal: {
    country_code: "PT",
    country_latitude: "39.399872",
    country_longitude: "-8.224454",
  },
  palau: {
    country_code: "PW",
    country_latitude: "7.51498",
    country_longitude: "134.58252",
  },
  paraguay: {
    country_code: "PY",
    country_latitude: "-23.442503",
    country_longitude: "-58.443832",
  },
  qatar: {
    country_code: "QA",
    country_latitude: "25.354826",
    country_longitude: "51.183884",
  },
  "r\u00e3\u00a9union": {
    country_code: "RE",
    country_latitude: "-21.115141",
    country_longitude: "55.536384",
  },
  romania: {
    country_code: "RO",
    country_latitude: "45.943161",
    country_longitude: "24.96676",
  },
  serbia: {
    country_code: "RS",
    country_latitude: "44.016521",
    country_longitude: "21.005859",
  },
  russia: {
    country_code: "RU",
    country_latitude: "61.52401",
    country_longitude: "105.318756",
  },
  rwanda: {
    country_code: "RW",
    country_latitude: "-1.940278",
    country_longitude: "29.873888",
  },
  "saudi arabia": {
    country_code: "SA",
    country_latitude: "23.885942",
    country_longitude: "45.079162",
  },
  "solomon islands": {
    country_code: "SB",
    country_latitude: "-9.64571",
    country_longitude: "160.156194",
  },
  seychelles: {
    country_code: "SC",
    country_latitude: "-4.679574",
    country_longitude: "55.491977",
  },
  sudan: {
    country_code: "SD",
    country_latitude: "12.862807",
    country_longitude: "30.217636",
  },
  sweden: {
    country_code: "SE",
    country_latitude: "60.128161",
    country_longitude: "18.643501",
  },
  singapore: {
    country_code: "SG",
    country_latitude: "1.352083",
    country_longitude: "103.819836",
  },
  "saint helena": {
    country_code: "SH",
    country_latitude: "-24.143474",
    country_longitude: "-10.030696",
  },
  slovenia: {
    country_code: "SI",
    country_latitude: "46.151241",
    country_longitude: "14.995463",
  },
  "svalbard and jan mayen": {
    country_code: "SJ",
    country_latitude: "77.553604",
    country_longitude: "23.670272",
  },
  slovakia: {
    country_code: "SK",
    country_latitude: "48.669026",
    country_longitude: "19.699024",
  },
  "sierra leone": {
    country_code: "SL",
    country_latitude: "8.460555",
    country_longitude: "-11.779889",
  },
  "san marino": {
    country_code: "SM",
    country_latitude: "43.94236",
    country_longitude: "12.457777",
  },
  senegal: {
    country_code: "SN",
    country_latitude: "14.497401",
    country_longitude: "-14.452362",
  },
  somalia: {
    country_code: "SO",
    country_latitude: "5.152149",
    country_longitude: "46.199616",
  },
  suriname: {
    country_code: "SR",
    country_latitude: "3.919305",
    country_longitude: "-56.027783",
  },
  "s\u00e3\u00a3o tom\u00e3\u00a9 and pr\u00e3\u00adncipe": {
    country_code: "ST",
    country_latitude: "0.18636",
    country_longitude: "6.613081",
  },
  "el salvador": {
    country_code: "SV",
    country_latitude: "13.794185",
    country_longitude: "-88.89653",
  },
  syria: {
    country_code: "SY",
    country_latitude: "34.802075",
    country_longitude: "38.996815",
  },
  swaziland: {
    country_code: "SZ",
    country_latitude: "-26.522503",
    country_longitude: "31.465866",
  },
  "turks and caicos islands": {
    country_code: "TC",
    country_latitude: "21.694025",
    country_longitude: "-71.797928",
  },
  chad: {
    country_code: "TD",
    country_latitude: "15.454166",
    country_longitude: "18.732207",
  },
  "french southern territories": {
    country_code: "TF",
    country_latitude: "-49.280366",
    country_longitude: "69.348557",
  },
  togo: {
    country_code: "TG",
    country_latitude: "8.619543",
    country_longitude: "0.824782",
  },
  thailand: {
    country_code: "TH",
    country_latitude: "15.870032",
    country_longitude: "100.992541",
  },
  tajikistan: {
    country_code: "TJ",
    country_latitude: "38.861034",
    country_longitude: "71.276093",
  },
  tokelau: {
    country_code: "TK",
    country_latitude: "-8.967363",
    country_longitude: "-171.855881",
  },
  "timor-leste": {
    country_code: "TL",
    country_latitude: "-8.874217",
    country_longitude: "125.727539",
  },
  turkmenistan: {
    country_code: "TM",
    country_latitude: "38.969719",
    country_longitude: "59.556278",
  },
  tunisia: {
    country_code: "TN",
    country_latitude: "33.886917",
    country_longitude: "9.537499",
  },
  tonga: {
    country_code: "TO",
    country_latitude: "-21.178986",
    country_longitude: "-175.198242",
  },
  turkey: {
    country_code: "TR",
    country_latitude: "38.963745",
    country_longitude: "35.243322",
  },
  "trinidad and tobago": {
    country_code: "TT",
    country_latitude: "10.691803",
    country_longitude: "-61.222503",
  },
  tuvalu: {
    country_code: "TV",
    country_latitude: "-7.109535",
    country_longitude: "177.64933",
  },
  taiwan: {
    country_code: "TW",
    country_latitude: "23.69781",
    country_longitude: "120.960515",
  },
  tanzania: {
    country_code: "TZ",
    country_latitude: "-6.369028",
    country_longitude: "34.888822",
  },
  ukraine: {
    country_code: "UA",
    country_latitude: "48.379433",
    country_longitude: "31.16558",
  },
  uganda: {
    country_code: "UG",
    country_latitude: "1.373333",
    country_longitude: "32.290275",
  },
  "u.s. minor outlying islands": {
    country_code: "UM",
    country_latitude: "",
    country_longitude: "",
  },
  uruguay: {
    country_code: "UY",
    country_latitude: "-32.522779",
    country_longitude: "-55.765835",
  },
  uzbekistan: {
    country_code: "UZ",
    country_latitude: "41.377491",
    country_longitude: "64.585262",
  },
  "vatican city": {
    country_code: "VA",
    country_latitude: "41.902916",
    country_longitude: "12.453389",
  },
  "saint vincent and the grenadines": {
    country_code: "VC",
    country_latitude: "12.984305",
    country_longitude: "-61.287228",
  },
  venezuela: {
    country_code: "VE",
    country_latitude: "6.42375",
    country_longitude: "-66.58973",
  },
  "british virgin islands": {
    country_code: "VG",
    country_latitude: "18.420695",
    country_longitude: "-64.639968",
  },
  "u.s. virgin islands": {
    country_code: "VI",
    country_latitude: "18.335765",
    country_longitude: "-64.896335",
  },
  vietnam: {
    country_code: "VN",
    country_latitude: "14.058324",
    country_longitude: "108.277199",
  },
  vanuatu: {
    country_code: "VU",
    country_latitude: "-15.376706",
    country_longitude: "166.959158",
  },
  "wallis and futuna": {
    country_code: "WF",
    country_latitude: "-13.768752",
    country_longitude: "-177.156097",
  },
  samoa: {
    country_code: "WS",
    country_latitude: "-13.759029",
    country_longitude: "-172.104629",
  },
  kosovo: {
    country_code: "XK",
    country_latitude: "42.602636",
    country_longitude: "20.902977",
  },
  yemen: {
    country_code: "YE",
    country_latitude: "15.552727",
    country_longitude: "48.516388",
  },
  mayotte: {
    country_code: "YT",
    country_latitude: "-12.8275",
    country_longitude: "45.166244",
  },
  "south africa": {
    country_code: "ZA",
    country_latitude: "-30.559482",
    country_longitude: "22.937506",
  },
  zambia: {
    country_code: "ZM",
    country_latitude: "-13.133897",
    country_longitude: "27.849332",
  },
  zimbabwe: {
    country_code: "ZW",
    country_latitude: "-19.015438",
    country_longitude: "29.154857",
  },
};

customElements.define("m-go", MapsGraphicalOverlay);
