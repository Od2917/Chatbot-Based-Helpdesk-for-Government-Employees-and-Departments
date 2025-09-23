import { Github, Mail, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Footer = () => {
  const teamMembers = [
    { name: "OMMSHREE OMMKAR DAS", role: "------" },
    { name: "DITYA YADAV", role: "------" },
    { name: "ABDUR RASHEED", role: "------" },
    
  ];

  return (
    <footer className="glass border-t border-border/50 bg-muted/30">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Team Credits */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">Development Team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamMembers.map((member, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <div className="space-y-3">
              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start">
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-sm">support@mha.gov.in</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start">
                <Github className="w-4 h-4 mr-2" />
                <span className="text-sm">GitHub Repository</span>
              </Button>
            </div>
          </div>

          {/* Compliance & Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Compliance</h3>
            <div className="space-y-3">
              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start">
                <Shield className="w-4 h-4 mr-2" />
                <span className="text-sm">WCAG 2.1 AA</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start">
                <FileText className="w-4 h-4 mr-2" />
                <span className="text-sm">Accessibility Statement</span>
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © 2024 Ministry of Home Affairs, Government of India. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>GIGW Compliant</span>
            <span>•</span>
            <span>DBIM Guidelines</span>
            <span>•</span>
            <span>Digital India Initiative</span>
          </div>
        </div>
      </div>
    </footer>
  );
};