var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

// Serve index.html by default and static files from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

//Test endpoint
app.MapGet("/health", () => Results.Ok("OK"));

app.Run();