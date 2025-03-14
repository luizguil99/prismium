import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Card, CardContent } from "./card";

export function TestimonialSection() {
  const testimonials = [
    {
      quote: "Working with this team has transformed our business. The solutions they provided exceeded our expectations.",
      author: "Sarah Johnson",
      role: "CEO, TechStart",
      avatar: "SJ"
    },
    {
      quote: "The attention to detail and customer service is unmatched. I highly recommend their services to anyone looking to grow their online presence.",
      author: "Michael Chen",
      role: "Marketing Director, GrowthCo",
      avatar: "MC"
    },
    {
      quote: "Their innovative approach helped us increase our conversion rates by 40% in just three months.",
      author: "Emma Rodriguez",
      role: "Product Manager, InnovateLabs",
      avatar: "ER"
    }
  ];

  return (
    <div className="py-16 container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Don't just take our word for it. Here's what our clients have to say about working with us.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="bg-card">
            <CardContent className="pt-6">
              <p className="italic mb-6">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
