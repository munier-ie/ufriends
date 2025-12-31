'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, RefreshCw, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react'

interface UIMetric {
  timestamp: number
  path: string
  method: string
  status: number
  ok: boolean
  duration: number
  error?: string
}

interface MetricsSummary {
  totalCalls: number
  successRate: number
  averageResponseTime: number
  errorRate: number
  pathStats: Record<string, {
    calls: number
    successRate: number
    avgDuration: number
  }>
}

export default function UIMetricsPage() {
  const [metrics, setMetrics] = useState<UIMetric[]>([])
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMetrics = () => {
    setLoading(true)
    try {
      const stored = localStorage.getItem('ufriends_ui_metrics')
      if (stored) {
        const parsedMetrics: UIMetric[] = JSON.parse(stored)
        setMetrics(parsedMetrics.sort((a, b) => b.timestamp - a.timestamp))
        
        // Calculate summary
        const totalCalls = parsedMetrics.length
        const successfulCalls = parsedMetrics.filter(m => m.ok).length
        const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0
        const averageResponseTime = totalCalls > 0 
          ? parsedMetrics.reduce((sum, m) => sum + m.duration, 0) / totalCalls 
          : 0
        const errorRate = 100 - successRate

        // Path-specific stats
        const pathStats: Record<string, { calls: number; successRate: number; avgDuration: number }> = {}
        parsedMetrics.forEach(metric => {
          if (!pathStats[metric.path]) {
            pathStats[metric.path] = { calls: 0, successRate: 0, avgDuration: 0 }
          }
          pathStats[metric.path].calls++
        })

        Object.keys(pathStats).forEach(path => {
          const pathMetrics = parsedMetrics.filter(m => m.path === path)
          const pathSuccessful = pathMetrics.filter(m => m.ok).length
          pathStats[path].successRate = (pathSuccessful / pathMetrics.length) * 100
          pathStats[path].avgDuration = pathMetrics.reduce((sum, m) => sum + m.duration, 0) / pathMetrics.length
        })

        setSummary({
          totalCalls,
          successRate,
          averageResponseTime,
          errorRate,
          pathStats
        })
      } else {
        setMetrics([])
        setSummary(null)
      }
    } catch (error) {
      console.error('Failed to load metrics:', error)
      setMetrics([])
      setSummary(null)
    }
    setLoading(false)
  }

  const clearMetrics = () => {
    localStorage.removeItem('ufriends_ui_metrics')
    setMetrics([])
    setSummary(null)
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">UI Metrics Dashboard</h1>
          <p className="text-muted-foreground">Monitor API call performance and success rates</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={clearMetrics} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Data
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCalls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              {summary.successRate >= 90 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(summary.averageResponseTime)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              {summary.errorRate <= 10 ? (
                <TrendingDown className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.errorRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {summary && Object.keys(summary.pathStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>API Endpoint Performance</CardTitle>
            <CardDescription>Performance breakdown by endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(summary.pathStats).map(([path, stats]) => (
                <div key={path} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{path}</div>
                    <div className="text-sm text-muted-foreground">
                      {stats.calls} calls • {formatDuration(stats.avgDuration)} avg
                    </div>
                  </div>
                  <Badge variant={stats.successRate >= 90 ? "default" : "destructive"}>
                    {stats.successRate.toFixed(1)}% success
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>Latest {metrics.length} recorded API calls</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No metrics data available. Make some API calls to see data here.
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.slice(0, 50).map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{metric.method}</Badge>
                      <span className="font-medium">{metric.path}</span>
                      <Badge variant={metric.ok ? "default" : "destructive"}>
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatTimestamp(metric.timestamp)}
                      {metric.error && (
                        <span className="text-red-600 ml-2">• {metric.error}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatDuration(metric.duration)}</div>
                    {metric.ok ? (
                      <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}