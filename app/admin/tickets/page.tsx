'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Loader2, 
  AlertCircle,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  User
} from 'lucide-react';

export default function TicketsPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { data: tickets, isLoading, error } = trpc.pilot.listAllTickets.useQuery();
  const utils = trpc.useUtils();
  
  const { data: ticketDetails, isLoading: detailsLoading } = trpc.pilot.getTicket.useQuery(
    { ticketId: selectedTicketId! },
    { enabled: !!selectedTicketId }
  );

  const addMessageMutation = trpc.pilot.addTicketMessage.useMutation({
    onSuccess: () => {
      utils.pilot.getTicket.invalidate({ ticketId: selectedTicketId! });
      setNewMessage('');
    },
  });

  const updateStatusMutation = trpc.pilot.updateTicketStatus.useMutation({
    onSuccess: () => {
      utils.pilot.listAllTickets.invalidate();
      utils.pilot.getTicket.invalidate({ ticketId: selectedTicketId! });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicketId) return;
    addMessageMutation.mutate({
      ticketId: selectedTicketId,
      message: newMessage.trim(),
    });
  };

  const handleStatusChange = (status: string) => {
    if (!selectedTicketId) return;
    updateStatusMutation.mutate({
      ticketId: selectedTicketId,
      status: status as any,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-red-100 text-red-700">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
      case 'waiting_response':
        return <Badge className="bg-yellow-100 text-yellow-700">Waiting Response</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-600 text-white">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">High</Badge>;
      case 'normal':
        return <Badge variant="outline">Normal</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-500">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const filteredTickets = tickets?.filter(t => 
    statusFilter === 'all' || t.status === statusFilter
  ) || [];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading tickets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Error loading tickets: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openCount = tickets?.filter(t => t.status === 'open').length || 0;
  const inProgressCount = tickets?.filter(t => t.status === 'in_progress').length || 0;
  const waitingCount = tickets?.filter(t => t.status === 'waiting_response').length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Tickets</h1>
        <p className="text-gray-600">
          Manage pilot user support requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'open' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-sm text-gray-500">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'in_progress' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'waiting_response' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'waiting_response' ? 'all' : 'waiting_response')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitingCount}</p>
                <p className="text-sm text-gray-500">Awaiting Reply</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'all' ? 'ring-2 ring-gray-400' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tickets?.length || 0}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets</h3>
              <p className="text-gray-500">
                {statusFilter === 'all' 
                  ? 'No support tickets have been created yet'
                  : `No tickets with status "${statusFilter}"`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className={`cursor-pointer hover:shadow-md transition-all ${
                ticket.status === 'open' ? 'border-l-4 border-l-red-500' :
                ticket.status === 'waiting_response' ? 'border-l-4 border-l-yellow-500' :
                ''
              }`}
              onClick={() => setSelectedTicketId(ticket.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {ticket.organizationName}
                      </span>
                      <span>{ticket.category}</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicketId} onOpenChange={() => setSelectedTicketId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {ticketDetails?.ticket.subject || 'Ticket Details'}
            </DialogTitle>
            <DialogDescription>
              {ticketDetails?.ticket.description}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : ticketDetails ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Ticket metadata */}
              <div className="flex items-center gap-3 py-3 border-b">
                {getStatusBadge(ticketDetails.ticket.status)}
                {getPriorityBadge(ticketDetails.ticket.priority)}
                <Badge variant="outline">{ticketDetails.ticket.category}</Badge>
                
                <Select
                  value={ticketDetails.ticket.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-[150px] ml-auto">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_response">Waiting Response</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 py-4">
                <div className="space-y-4">
                  {/* Original description as first message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm">{ticketDetails.ticket.description}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(ticketDetails.ticket.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Conversation messages */}
                  {ticketDetails.messages.map((msg: any) => (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 ${msg.sender_type === 'admin' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender_type === 'admin' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <User className={`h-4 w-4 ${
                          msg.sender_type === 'admin' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className={`rounded-lg p-3 ${
                          msg.sender_type === 'admin' ? 'bg-green-50' : 'bg-gray-100'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${
                          msg.sender_type === 'admin' ? 'text-right' : ''
                        }`}>
                          {msg.sender_type === 'admin' ? 'You · ' : ''}
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply box */}
              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || addMessageMutation.isPending}
                    className="self-end"
                  >
                    {addMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

