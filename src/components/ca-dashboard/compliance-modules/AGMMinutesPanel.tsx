import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, FileText, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AGMMinutesPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Users className="w-6 h-6 text-indigo-500" />
            AGM Notice & Minutes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            21-day notice tracking and compliant AGM minutes generation.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">Draft New Notice</Button>
      </div>

      <Card className="border-border/50 bg-card/30">
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Financial Year</th>
                <th className="px-4 py-3 font-medium">AGM Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="w-8 h-8 opacity-20" />
                    <p>No AGM records found. Once clients are synced, their data will appear here.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
