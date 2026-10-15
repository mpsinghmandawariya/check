
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int c = sc.nextInt();

        int[] arr = new int[n];

        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        Arrays.sort(arr);

        int low = 1;
        int high = arr[n - 1] - arr[0];
        int ans = 0;

        while (low <= high) {
            int mid = low + (high - low) / 2;

            int cows = 1;
            int last = arr[0];

            for (int i = 1; i < n; i++) {
                if (arr[i] - last >= mid) {
                    cows++;
                    last = arr[i];
                }
            }

            if (cows >= c) {
                ans = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        System.out.println(ans);
        sc.close();
    }
}

