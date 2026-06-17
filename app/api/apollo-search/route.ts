import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, filters } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "Apollo API key required" }, { status: 400 });
    }

    // Build Apollo search params
    const searchParams: Record<string, unknown> = {
      per_page: filters.perPage || 25,
      page: 1,
    };

    if (filters.titles?.length > 0) {
      searchParams.person_titles = filters.titles;
    }

    if (filters.industries?.length > 0) {
      searchParams.organization_industry_tag_ids = filters.industries;
    }

    if (filters.locations?.length > 0) {
      searchParams.person_locations = filters.locations;
    }

    if (filters.keywords?.length > 0) {
      searchParams.q_keywords = filters.keywords.join(" ");
    }

    if (filters.employeeCountMin || filters.employeeCountMax) {
      searchParams.organization_num_employees_ranges = [
        `${filters.employeeCountMin || 1},${filters.employeeCountMax || 1000000}`,
      ];
    }

    const response = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Apollo API error:", response.status, err);
      return NextResponse.json(
        { error: `Apollo API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const people = (data.people || []).map(
      (p: {
        first_name?: string;
        last_name?: string;
        email?: string;
        title?: string;
        organization?: { name?: string; industry?: string; estimated_num_employees?: number };
        linkedin_url?: string;
        city?: string;
        state?: string;
        country?: string;
      }) => ({
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        email: p.email || "",
        title: p.title || "",
        company: p.organization?.name || "",
        industry: p.organization?.industry || "",
        linkedin_url: p.linkedin_url || "",
        company_size: p.organization?.estimated_num_employees || 0,
        location: [p.city, p.state, p.country].filter(Boolean).join(", "),
      })
    );

    // Filter out contacts without email
    const withEmail = people.filter(
      (p: { email: string }) => p.email && p.email.includes("@")
    );

    return NextResponse.json({
      prospects: withEmail,
      totalAvailable: data.pagination?.total_entries || 0,
      page: data.pagination?.page || 1,
      perPage: data.pagination?.per_page || 25,
    });
  } catch (error) {
    console.error("Apollo search error:", error);
    return NextResponse.json(
      { error: "Failed to search Apollo" },
      { status: 500 }
    );
  }
}
