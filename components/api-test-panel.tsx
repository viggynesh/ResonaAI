"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"

export default function ApiTestPanel() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testClaudeAPI = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-claude")
      const result = await response.json()
      setTestResults(result)
      console.log("🧪 Claude test result:", result)
    } catch (error) {
      console.error("Test failed:", error)
      setTestResults({ success: false, error: "Network error" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">API Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testClaudeAPI} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing Claude API...
            </>
          ) : (
            "Test Claude API Connection"
          )}
        </Button>

        {testResults && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {testResults.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <Badge variant={testResults.success ? "default" : "destructive"}>
                {testResults.success ? "Connected" : "Failed"}
              </Badge>
            </div>

            {testResults.success && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-700">✅ Claude API Working!</p>
                <p className="text-xs text-green-600 mt-1">Test response: "{testResults.testResponse}"</p>
                <p className="text-xs text-green-500 mt-1">Model: {testResults.model}</p>
                {testResults.keyUsed && <p className="text-xs text-green-400 mt-1">Key: {testResults.keyUsed}</p>}
              </div>
            )}

            {!testResults.success && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm font-medium text-red-700">❌ API Test Failed</p>
                </div>
                <p className="text-xs text-red-600 mb-1">Error: {testResults.error}</p>
                {testResults.details && (
                  <div className="text-xs text-red-500 mt-2 p-2 bg-red-100 rounded">
                    <p className="font-medium">Details:</p>
                    <pre className="whitespace-pre-wrap">{testResults.details}</pre>
                  </div>
                )}
                {testResults.keyUsed && <p className="text-xs text-red-400 mt-1">Key used: {testResults.keyUsed}</p>}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
