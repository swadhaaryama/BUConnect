import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import MessageCard from "@/components/message-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { User, Message } from "@shared/schema";
import { format } from "date-fns";

type Conversation = {
  partnerId: number;
  partnerName?: string;
  partnerPicture?: string;
  latestMessage: Message;
  unreadCount: number;
};

export default function MessagesPage() {
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  
  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
  });
  
  // Fetch selected conversation messages
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation],
    enabled: selectedConversation !== null,
  });
  
  // Fetch partner details
  const { data: partner } = useQuery<User>({
    queryKey: ["/api/user", selectedConversation],
    enabled: selectedConversation !== null,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: { receiverId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", message);
      return await res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle send message
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedConversation,
      content: messageText,
    });
  };
  
  // Get user initials
  const getInitials = (name: string = "") => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedConversation ? (
          <div className="flex flex-col h-[calc(100vh-180px)]">
            {/* Conversation header */}
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2"
                  onClick={() => setSelectedConversation(null)}
                >
                  <i className="fas fa-arrow-left"></i>
                </Button>
                {partner?.profilePicture ? (
                  <img
                    src={partner.profilePicture}
                    alt={`${partner.name}'s profile`}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <span className="text-sm text-gray-500 font-medium">
                      {getInitials(partner?.name)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{partner?.name}</h3>
                  <p className="text-xs text-gray-500">
                    {partner?.vehicle ? `${partner.vehicle} • ${partner.vehicleColor}` : "Passenger"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <i className="fas fa-info-circle"></i>
              </Button>
            </div>
            
            {/* Messages */}
            <div className="flex-grow overflow-y-auto mb-4 space-y-3">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === selectedConversation ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.senderId === selectedConversation
                          ? "bg-gray-100 text-gray-800"
                          : "bg-primary text-white"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.senderId === selectedConversation
                          ? "text-gray-500"
                          : "text-white text-opacity-80"
                      }`}>
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400">Send a message to start the conversation</p>
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="flex items-center">
              <Input
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="mr-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Messages</h2>
            
            {/* Conversation List */}
            {conversationsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <MessageCard
                    key={conversation.partnerId}
                    id={conversation.partnerId}
                    partner={{
                      id: conversation.partnerId,
                      name: conversation.partnerName || "User",
                      profilePicture: conversation.partnerPicture,
                    } as User}
                    lastMessage={conversation.latestMessage.content}
                    timestamp={new Date(conversation.latestMessage.createdAt)}
                    unread={conversation.unreadCount > 0}
                    onClick={() => setSelectedConversation(conversation.partnerId)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                  <i className="fas fa-comment-alt text-gray-500"></i>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
                <p className="mt-1 text-sm text-gray-500">Start a conversation with a rider or driver.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}









import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { insertRideSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout";
import MapView from "@/components/map-view";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Form validation schema
const formSchema = insertRideSchema.omit({ driverId: true });
type FormData = z.infer<typeof formSchema>;

export default function OfferRidePage() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: "",
      to: "",
      departureDate: "",
      departureTime: "",
      availableSeats: 1,
      price: 50,
      notes: "",
    },
  });
  
  // Offer ride mutation
  const offerRideMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/rides", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      toast({
        title: "Ride offered successfully",
        description: "Your ride has been posted and is now visible to other users.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error offering ride",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: FormData) => {
    offerRideMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Offer a Ride</h2>
        
        {/* Offer Ride Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* From and To locations */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                        <i className="fas fa-map-marker-alt"></i>
                      </span>
                      <FormControl>
                        <Input
                          placeholder="Pickup location"
                          className="rounded-l-none"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                        <i className="fas fa-map-pin"></i>
                      </span>
                      <FormControl>
                        <Input
                          placeholder="Destination"
                          className="rounded-l-none"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="departureTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Available Seats */}
            <FormField
              control={form.control}
              name="availableSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Seats</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of seats" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Price per Seat */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Seat (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="50"
                      min={10}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Additional Details */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about the ride..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={offerRideMutation.isPending}
            >
              {offerRideMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Offer Ride"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
