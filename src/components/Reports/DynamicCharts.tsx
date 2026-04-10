'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import styles from './DynamicCharts.module.scss';

interface ProductData {
  productName: string;
  months: Record<string, { count: number; sum: number }>;
  totalCount: number;
  totalSum: number;
}

interface MonthData {
  key: string;
  label: string;
  fullLabel: string;
  year: number;
  monthNumber: number;
}

interface DynamicChartsProps {
  productRows: ProductData[];
  months: MonthData[];
  isMobile: boolean;
  reportType?: string;
}

interface ChartDataPoint {
  month: string;
  label: string;
  [key: string]: string | number;
}

const shapes = [
  { name: 'circle', symbol: 'circle', path: 'M0,0 m -3,0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0' },
  { name: 'square', symbol: 'square', path: 'M-3,-3 L3,-3 L3,3 L-3,3 Z' },
  { name: 'diamond', symbol: 'diamond', path: 'M0,-4 L4,0 L0,4 L-4,0 Z' },
  { name: 'triangle', symbol: 'triangle', path: 'M0,-4 L4,4 L-4,4 Z' },
  { name: 'cross', symbol: 'cross', path: 'M-3,0 L3,0 M0,-3 L0,3' },
  { name: 'star', symbol: 'star', path: 'M0,-4 L1,-1 L4,-1 L2,1 L3,4 L0,2 L-3,4 L-2,1 L-4,-1 L-1,-1 Z' },
];

const CustomDot = (props: any) => {
  const { cx, cy, payload, shape, color } = props;
  if (!cx || !cy) return null;

  const shapeConfig = shapes.find(s => s.name === shape);
  if (!shapeConfig) return null;

  return (
    <g transform={`translate(${cx},${cy})`}>
      <path
        d={shapeConfig.path}
        fill={color}
        stroke={color}
        strokeWidth={1}
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
};

const DynamicCharts: React.FC<DynamicChartsProps> = ({ productRows, months, isMobile, reportType = 'drinks' }) => {
  let filteredProducts = useMemo(() => {
    return productRows.filter(product =>
      !product.productName.toLowerCase().includes('сотрудник')
    );
  }, [productRows]);

  filteredProducts = useMemo(() => {
    if (reportType === 'desserts') {
      const sorted = [...filteredProducts].sort((a, b) => b.totalSum - a.totalSum);
      const top12 = sorted.slice(0, 12);
      console.log(`Desserts mode: showing top ${top12.length} products out of ${filteredProducts.length}`);
      return top12;
    }
    return filteredProducts;
  }, [filteredProducts, reportType]);

  const productStyleMap = useMemo(() => {
    const map = new Map<string, { color: string; shape: string }>();

    const colors = [
      '#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0',
      '#00bcd4', '#795548', '#e91e63', '#3f51b5', '#009688',
      '#ff5722', '#607d8b', '#8bc34a', '#ffc107', '#cddc39'
    ];

    filteredProducts.forEach((product, index) => {
      map.set(product.productName, {
        color: colors[index % colors.length],
        shape: shapes[index % shapes.length].name
      });
    });

    return map;
  }, [filteredProducts]);

  const { topCountProducts, bottomCountProducts } = useMemo(() => {
    const sorted = [...filteredProducts].sort((a, b) => b.totalCount - a.totalCount);
    const midIndex = Math.ceil(sorted.length / 2);

    return {
      topCountProducts: sorted.slice(0, midIndex),
      bottomCountProducts: sorted.slice(midIndex)
    };
  }, [filteredProducts]);

  const { topSumProducts, bottomSumProducts } = useMemo(() => {
    const sorted = [...filteredProducts].sort((a, b) => b.totalSum - a.totalSum);
    const midIndex = Math.ceil(sorted.length / 2);

    return {
      topSumProducts: sorted.slice(0, midIndex),
      bottomSumProducts: sorted.slice(midIndex)
    };
  }, [filteredProducts]);

  const prepareChartData = (products: ProductData[], dataKey: 'count' | 'sum'): ChartDataPoint[] => {
    if (products.length === 0) return [];

    return months.map(month => {
      const point: ChartDataPoint = { month: month.key, label: month.label };

      products.forEach(product => {
        const value = product.months[month.key]?.[dataKey] || 0;
        point[product.productName] = value;
      });

      return point;
    });
  };

  const getYAxisDomain = (products: ProductData[], dataKey: 'count' | 'sum'): [number, number] => {
    if (products.length === 0) return [0, 100];

    let maxValue = 0;
    products.forEach(product => {
      Object.values(product.months).forEach(month => {
        const value = month[dataKey];
        if (value > maxValue) maxValue = value;
      });
    });

    return [0, maxValue * 1.1];
  };

  const formatYAxis = (value: number, dataKey: 'count' | 'sum') => {
    if (dataKey === 'count') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
      return value.toString();
    } else {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
      return value.toString();
    }
  };

  const renderTooltip = (props: any, dataKey: 'count' | 'sum') => {
    const { active, payload, label } = props;

    if (!active || !payload || payload.length === 0) return null;

    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

    return (
      <div className={styles.customTooltip}>
        <div className={styles.tooltipLabel}>{label}</div>
        <div className={styles.tooltipItems}>
          {sortedPayload.map((entry: any, index: number) => {
            const style = productStyleMap.get(entry.name);
            const shapeConfig = shapes.find(s => s.name === style?.shape);
            return (
              <div key={index} className={styles.tooltipItem}>
                <svg width="16" height="16" viewBox="0 0 10 10" style={{ marginRight: '4px' }}>
                  <path
                    d={shapeConfig?.path || shapes[0].path}
                    fill={style?.color}
                    stroke={style?.color}
                    strokeWidth="1"
                    transform="translate(5,5)"
                  />
                </svg>
                <span className={styles.tooltipName} title={entry.name}>
                  {entry.name.length > (isMobile ? 20 : 30)
                    ? `${entry.name.substring(0, isMobile ? 17 : 27)}...`
                    : entry.name}
                </span>
                <span className={styles.tooltipValue}>
                  {dataKey === 'count'
                    ? `${entry.value.toLocaleString('ru-RU')} шт.`
                    : `${entry.value.toLocaleString('ru-RU')} ₽`
                  }
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getValueRange = (products: ProductData[], dataKey: 'count' | 'sum') => {
    if (products.length === 0) return '';
    const minValue = Math.min(...products.map(p => p[dataKey === 'count' ? 'totalCount' : 'totalSum']));
    const maxValue = Math.max(...products.map(p => p[dataKey === 'count' ? 'totalCount' : 'totalSum']));

    if (dataKey === 'count') {
      return `от ${minValue.toLocaleString('ru-RU')} до ${maxValue.toLocaleString('ru-RU')} шт.`;
    } else {
      return `от ${minValue.toLocaleString('ru-RU')} до ${maxValue.toLocaleString('ru-RU')} ₽`;
    }
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <ul className={styles.customLegend}>
        {payload.map((entry: any, index: number) => {
          const style = productStyleMap.get(entry.value);
          const shapeConfig = shapes.find(s => s.name === style?.shape);
          return (
            <li key={`item-${index}`} className={styles.legendItem}>
              <svg width="14" height="14" viewBox="0 0 10 10" className={styles.legendIcon}>
                <path
                  d={shapeConfig?.path || shapes[0].path}
                  fill={style?.color}
                  stroke={style?.color}
                  strokeWidth="1"
                  transform="translate(5,5)"
                />
              </svg>
              <span style={{ color: style?.color }} className={styles.legendText}>
                {entry.value}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderChart = (
    products: ProductData[],
    title: string,
    subtitle: string,
    dataKey: 'count' | 'sum',
    valueType: string
  ) => {
    if (products.length === 0) {
      return (
        <div className={styles.emptyChart}>
          <p>Нет данных для отображения</p>
        </div>
      );
    }

    const chartData = prepareChartData(products, dataKey);
    const yAxisDomain = getYAxisDomain(products, dataKey);
    const valueRange = getValueRange(products, dataKey);

    const margin = isMobile
      ? { top: 10, right: 10, left: 10, bottom: 10 }
      : { top: 10, right: 20, left: 20, bottom: 10 };

    return (
      <div className={styles.chartCard}>
        <h4 className={styles.chartTitle}>
          {title}
          <span className={styles.subtitle}>{subtitle}</span>
          <span className={styles.rangeInfo}>{valueRange}</span>
        </h4>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
            <LineChart
              data={chartData}
              margin={margin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: isMobile ? 10 : 11 }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={isMobile ? 50 : 55}
                dy={5}
              />
              <YAxis
                tick={{ fontSize: isMobile ? 10 : 11 }}
                domain={yAxisDomain}
                tickFormatter={(value) => formatYAxis(value, dataKey)}
                width={isMobile ? 45 : 55}
                allowDecimals={false}
              />
              <Tooltip
                content={(props) => renderTooltip(props, dataKey)}
                contentStyle={{ fontSize: isMobile ? 11 : 12, maxHeight: isMobile ? 200 : 300, overflowY: 'auto' }}
              />
              <Legend
                content={renderLegend}
                wrapperStyle={{
                  fontSize: isMobile ? 10 : 11,
                  paddingTop: 12,
                  paddingBottom: 4
                }}
              />
              <ReferenceLine y={0} stroke="#666" />
              {products.map((product) => {
                const style = productStyleMap.get(product.productName);
                return (
                  <Line
                    key={product.productName}
                    type="monotone"
                    dataKey={product.productName}
                    stroke={style?.color}
                    strokeWidth={1.5}
                    dot={(props: any) => {
                      const { cx, cy } = props;
                      if (!cx || !cy) return null;
                      return (
                        <CustomDot
                          cx={cx}
                          cy={cy}
                          shape={style?.shape}
                          color={style?.color}
                        />
                      );
                    }}
                    activeDot={(props: any) => {
                      const { cx, cy } = props;
                      if (!cx || !cy) return null;
                      return (
                        <CustomDot
                          cx={cx}
                          cy={cy}
                          shape={style?.shape}
                          color={style?.color}
                        />
                      );
                    }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const avgCount = filteredProducts.length > 0
    ? Math.round(filteredProducts.reduce((sum, p) => sum + p.totalCount, 0) / filteredProducts.length)
    : 0;
  const avgSum = filteredProducts.length > 0
    ? Math.round(filteredProducts.reduce((sum, p) => sum + p.totalSum, 0) / filteredProducts.length)
    : 0;

  const topCountCount = topCountProducts.length;
  const bottomCountCount = bottomCountProducts.length;
  const topSumCount = topSumProducts.length;
  const bottomSumCount = bottomSumProducts.length;

  const showOnlyTop = reportType === 'desserts';

  return (
    <div className={styles.dynamicCharts}>
      <h3 className={styles.sectionTitle}>
        Динамика продаж
        <span className={styles.totalProducts}>
          {reportType === 'desserts'
            ? `Показаны лучшие ${filteredProducts.length} товаров из ${productRows.filter(p => !p.productName.toLowerCase().includes('сотрудник')).length}`
            : `Всего товаров: ${filteredProducts.length}`
          }
        </span>
      </h3>

      <div className={styles.chartsSection}>
        <div className={styles.chartGroup}>
          <h4 className={styles.groupTitle}>
            Количество продаж — лучшие 50% ({topCountCount} товаров)
          </h4>
          {renderChart(
            topCountProducts,
            'Товары с высокими продажами',
            `(выше среднего: ${avgCount.toLocaleString('ru-RU')} шт.)`,
            'count',
            'шт.'
          )}
        </div>

        {!showOnlyTop && (
          <div className={styles.chartGroup}>
            <h4 className={styles.groupTitle}>
              Количество продаж — худшие 50% ({bottomCountCount} товаров)
            </h4>
            {renderChart(
              bottomCountProducts,
              'Товары с низкими продажами',
              `(ниже среднего: ${avgCount.toLocaleString('ru-RU')} шт.)`,
              'count',
              'шт.'
            )}
          </div>
        )}
      </div>

      <h3 className={styles.sectionTitle}>
        Динамика выручки
        <span className={styles.totalProducts}>
          {reportType === 'desserts'
            ? `Показаны лучшие ${filteredProducts.length} товаров из ${productRows.filter(p => !p.productName.toLowerCase().includes('сотрудник')).length}`
            : `Всего товаров: ${filteredProducts.length}`
          }
        </span>
      </h3>

      <div className={styles.chartsSection}>
        <div className={styles.chartGroup}>
          <h4 className={styles.groupTitle}>
            Выручка — лучшие 50% ({topSumCount} товаров)
          </h4>
          {renderChart(
            topSumProducts,
            'Товары с высокой выручкой',
            `(выше среднего: ${avgSum.toLocaleString('ru-RU')} ₽)`,
            'sum',
            '₽'
          )}
        </div>

        {!showOnlyTop && (
          <div className={styles.chartGroup}>
            <h4 className={styles.groupTitle}>
              Выручка — худшие 50% ({bottomSumCount} товаров)
            </h4>
            {renderChart(
              bottomSumProducts,
              'Товары с низкой выручкой',
              `(ниже среднего: ${avgSum.toLocaleString('ru-RU')} ₽)`,
              'sum',
              '₽'
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicCharts;